const Coupon =  require('../models/couponSchema')
const orderModel =require('../models/orderSchema')
const userCollection =require('../models/userSchema')
const {decreaseWalletAmount}=require("../helpers/productReturnHelper")



// calculating total by decreasing the wallet amount 
function walletAmount(userdata, grandTotal) {
    const wallet = userdata.wallet
    const walletBalance = wallet.balance
    const total = grandTotal - walletBalance;
    return total
}

// checking for valid Coupon
async function  isValidCoupon(couponCode, user, total) {
   
    const currentDate = new Date(); 
    const findCoupon = await Coupon.findOne({ code: couponCode });    

    if (findCoupon) {
        if (findCoupon.expirationDate && currentDate > findCoupon.expirationDate) {
            return { coupon: null, message: 'Coupon is expired' };

        } else if (findCoupon.maximumUses > 0) {
            if (user.coupons) {

                const couponId = String(findCoupon._id); //finding matching productId from orderDb
                const isCouponused = user.coupons.find(coupon => String(coupon._id) === couponId);

                if (isCouponused) {
                    return { coupon: null, message: 'Coupon is invalid.' };
                }
            }
        }

        if (total < findCoupon.minimumPurchase || total > findCoupon.maximumPurchase) {

            const minimumPurchase = findCoupon.minimumPurchase;
            const maximumPurchase = findCoupon.maximumPurchase;
            return { coupon: null, message: `Order total must be greater than ${minimumPurchase} , less than ${maximumPurchase} to get this coupon ` };
        }

        return { coupon: findCoupon, message: findCoupon.description };

    } else {
        return { coupon: null, message: 'Coupon is not valid! , try another one.' };
    }
}

// calculate amount after coupon discount
function calculateCouponDiscount(findCoupon, total) {
    const grandTotal = []
    const finalTotal = Math.ceil(total * ((100 - findCoupon.discountAmount) / 100))
    const discountAmount = total - finalTotal;

    grandTotal.push(finalTotal, discountAmount)
    return grandTotal
}

// changing the payment status and updating walletBalance--
const changePaymentStatus = async (orderId, user, amount) => {

    const orderUpdated = await orderModel.findByIdAndUpdate(
        { _id: orderId },
        { paymentStatus: 'Paid', amountPaid: amount });

    if (orderUpdated.paymentMethod == 'PaywithWallet') {
        const findWallet = await userCollection.findById({ _id: user }).populate('wallet')
        const walletBalance = findWallet.wallet.balance

        const description = 'payWithWallet';
        const type = 'debit'
        decreaseWalletAmount(user, walletBalance, description, type)
        await orderModel.findByIdAndUpdate(
            { _id: orderId },
            { walletPayment: walletBalance, amountPaid: amount }
        );
    }
    return orderUpdated;
};

// Generating invoice structure
const generateInvoice = async (orderId) => {
    const orderData = await orderModel.findById(orderId)
      .populate('items.product')
      .populate('address');
  
    if (!orderData) {
      throw new Error('Order not found');
    }
  
    console.log('orderData:', orderData);
  
    const docDefinition = {
      content: [
        {
          text: 'INVOICE',
          style: 'header',
          alignment: 'center', 
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: `Order Date: ${orderData.orderDate.toLocaleDateString()}` },
                { text: `Order ID: ${orderData.orderId}` },
              ],
            },
            {
              width: '*',
              stack: [
                { text: `Delivered Date: ${orderData.deliveredDate ? orderData.deliveredDate.toLocaleDateString() : 'N/A'}`, alignment: 'right' },
              ],
            },
          ],
        },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Billing Address:', style: 'subheader' },
                {
                  text: [
                    orderData.address.address_name,
                    orderData.address.house_name,
                    orderData.address.street_address,
                    orderData.address.city,
                    orderData.address.state,
                    orderData.address.pincode,
                    orderData.address.phone,
                  ].filter(Boolean).join('\n'), // Filter out any undefined values
                  style: 'address',
                },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'Payment Information:', style: 'subheader', alignment: 'right' },
                {
                  text: `Payment Method: ${orderData.paymentMethod}\nPayment Status: ${orderData.paymentStatus}\nWallet Payment: ₹${orderData.walletPayment}`,
                  style: 'info',
                  alignment: 'right'
                },
              ],
            },
          ],
        },
        { text: 'Order Summary:', style: 'subheader' },
        {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [{ text: 'Product', style: 'tableHeader' }, { text: 'Quantity', style: 'tableHeader' }, { text: 'Price', style: 'tableHeader' }],
              ...orderData.items.map(item => [
                item.product.productName || 'Unknown Product', 
                item.quantity, 
                `₹${item.salePrice ? item.salePrice.toLocaleString() : 'N/A'}`
              ]),
              ['Subtotal', '', `₹${orderData.subtotal ? orderData.subtotal.toLocaleString() : 'N/A'}`],
              ['Processing Fee', '', `₹${orderData.processingFee ? orderData.processingFee.toLocaleString() : 'N/A'}`],
              ['Total', '', `₹${orderData.total ? orderData.total.toLocaleString() : 'N/A'}`],
            ],
          },
        },
        {
          text: 'Thank you for shopping with us. Have a good day.',
          alignment: 'center',
          style: 'footer',
          margin: [0, 20, 0, 0]
        }
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5],
        },
        address: {
          fontSize: 12,
          margin: [0, 0, 0, 10],
        },
        info: {
          fontSize: 12,
          margin: [0, 0, 0, 10],
        },
        tableHeader: {
          fillColor: '#337ab7',
          color: '#ffffff',
          alignment: 'center',
          bold: true,
        },
        tableCell: {
          fillColor: '#f2f2f2',
          alignment: 'center',
        },
      },
    };
  
    return docDefinition;
  };
  

module.exports ={
    walletAmount,
    isValidCoupon,
    calculateCouponDiscount,
    changePaymentStatus,
    generateInvoice

}
