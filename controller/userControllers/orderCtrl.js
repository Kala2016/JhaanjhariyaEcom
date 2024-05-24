const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const orderModel = require("../../models/orderSchema");
const Wallet = require("../../models/walletSchema");
const Coupon=require('../../models/couponSchema');
const { calculateSubtotal } = require("../../utility/ordercalcalculation");
const { checkCartItemsMatch } = require("../../helpers/checkCartHelper");
const { getStatusClass } = require("../../helpers/getStatusHelper");
const { isValidCoupon,calculateCouponDiscount,walletAmount,changePaymentStatus,generateInvoice} = require("../../helpers/placeOrderHelper");
const { decreaseQuantity, updateWalletAmount, decreaseWalletAmount } = require("../../helpers/productReturnHelper");
const { generateRazorPay,verifyingPayment } = require("../../config/razorpay");






  const checkoutPage = async (req, res) => {
    try {
      // Retrieve user data with cart and addresses
      const user = req.userId;
      console.log("UserID----", user);
      const userWithCart = await userCollection
        .findById(user)
        .populate("cart.productId")
        .populate("cart.productId.salePrice");
      const userWithAddress = await userCollection
        .findById(user)
        .populate({ path: "addresses", model: "address" });
      const address = userWithAddress.addresses;

      console.log("userWithAddress", userWithAddress);

      // Check if the cart is empty
      if (!userWithCart.cart.length) {
        return res.redirect("/shopping-cart");
      }

      // Calculate subtotal and check for out of stock items
      const totalArray = calculateSubtotal(userWithCart);
      if (!totalArray) {
        req.flash("warning", "OOPS!, Out of Stock");
        return res.redirect("/shopping-cart");
      }

      // Destructure the totalArray for readability
      const [cartItem, cartSubtotal, processingFee, grandTotal] = totalArray;

      // Assuming couponCode is obtained from request parameters
      const couponCode = req.params.couponCode; // Adjust as per your route setup
      const total = grandTotal; // Adjust this based on your calculation logic


      const coupons = await isValidCoupon(couponCode, user, total);
      

      let totalAmountToPay = false;
      let minBalance = false;
      let walletBalance = 0; 
      let amount = false;
      const findWallet = await userCollection.findById(user).populate("wallet");
      if (findWallet.wallet) {
        walletBalance = findWallet.wallet.balance;
        if (walletBalance > grandTotal) {
          amount = true;
        }
        if (walletBalance > 0 && walletBalance < grandTotal) {
          minBalance = true;
        }
      }

      // Render the checkout page with data
      res.render("users/pages/checkoutPage", {
        cartItem,
        cartSubtotal,
        processingFee,
        grandTotal,
        address,
        walletBalance,
        amount,
        minBalance,
        coupons

      });

      console.log("cartItem---:", cartItem);
      console.log("grandTotal---:", grandTotal);
      console.log("cartSubtotal---", cartSubtotal);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  };

  const couponDetails = async(req,res)=>{
    try {

        const listCoupons = await Coupon.find()

        
        res.json({title:'Coupons',coupons:listCoupons})

        console.log('coupons',listCoupons)

        
    } catch (error) {
        console.error(error)
    }
}




//checkCart

const checkCart = async (req, res) => {
  try {
    console.log("req recieved in checkcart");
    const user = req.session.userId;
    console.log("user", user);
    const cartItem = req.query.originalCartInput;
    console.log("cart items :>> ", cartItem);

    const userWithCart = await userCollection
      .findById(user)
      .populate("cart.product");

    const cartProduct = userWithCart.cart.map((cartItem) => ({
      product: cartItem.productId,
      quantity: cartItem.quantity,
    }));
    // Compare the arrays
    const cartItemsMatch = checkCartItemsMatch(cartItem, cartProduct);

    if (cartItemsMatch) {
      res.json({ success: true, message: "Cart items match" });
    } else {
      res.json({ success: false, message: "Cart items do not match" });
    }
  } catch (error) {
    console.error(error);
  }
};


//update Wallet in Checkout

const updateWalletInCheckout = async (req, res) => {
  try {
    const { total, couponCode } = req.query;
    const user = req.userId;

    const findWallet = await userCollection
      .findById({ _id: user })
      .populate("wallet");
    const walletBalance = findWallet.wallet.balance;

    if (walletBalance < total) {
      let amountTopay = total - walletBalance;
      if (couponCode) {
        const findCoupon = await isValidCoupon(couponCode, user, total);
        if (findCoupon.coupon) {
          const grandTotal = calculateCouponDiscount(findCoupon.coupon, total);
          const [discountTotal, discountAmount] = [...grandTotal];
          amountTopay = discountTotal - walletBalance;
        }
      }
      res.json({ success: true, amountTopay, walletBalance });
    } else {
      console.log("error:Wallet amount is greater than Total");
      res.json({ error: 404 });
    }
  } catch (error) {
    console.error(error);
  }
};

// apply Coupon

const applyCoupon = async (req, res) => {
  try {
    const user = req.userId;
    const { couponCode, total, walAmount } = req.body;
    console.log()
   
    console.log("user",user)

    const findCoupon = await isValidCoupon(couponCode, user, total);
    console.log("couponCode",couponCode);

    console.log('findCoupon',findCoupon);

    if (findCoupon.coupon) {
      const grandTotal = calculateCouponDiscount(findCoupon.coupon, total);
      const [toatalAfterDiscount, discountAmount] = [...grandTotal];

      let amountToPay = toatalAfterDiscount;

      if (walAmount !== '') {
        amountToPay = toatalAfterDiscount - Number(walAmount);
      }

      if (
        total > findCoupon.coupon.minimumPurchase &&
        total < findCoupon.coupon.maximumPurchase
      ) {
        res.json({
          success: true,
          amountToPay,
          discountAmount,
          message: findCoupon.message,
        });
      }
    } else {
      res.json({ success: false, message: findCoupon.message });
    }
  } catch (error) {
    console.error(error);
  }
};

const placeOrder = async (req, res) => {
  try {
    const user = req.userId;
    
    const { couponCode, address, paymentMethod,  } = req.body;

    // Retrieve user data with cart
    const userWithCart = await userCollection.findById(user)
      .populate("cart.productId")
      .populate("cart.productId.salePrice");

    const findAddress = await userCollection.findOne(
      { _id: user, "addresses._id": address },
      { "addresses.$": 1 }
    );
    const userAddress = findAddress.addresses[0];

    // Check if userWithCart is null or undefined
    if (!userWithCart) {
      return res.status(404).json({ error: "User not found!" });
    }

    // Check if userWithCart.cart is null or undefined
    if (!userWithCart.cart || userWithCart.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty!" });
    }

    // Calculate totalArray
    const totalArray = calculateSubtotal(userWithCart);
    if (!totalArray) {
      return res.json({ outofStock: true, message: "Out of Stock" });
    }

    // Destructure the totalArray for readability
    const [cartItem, cartSubtotal, processingFee, grandTotal] = totalArray;

    if (paymentMethod === 'COD' && grandTotal > 1000) {
      req.flash('error', 'COD not allowed for orders above Rs 1000! Choose another payment method.');
      // return res.redirect('/checkoutPage'); // Redirect to checkout page or any appropriate page
    }

    // Map cart items to orderItems
    const orderItems = cartItem.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      price: item.product.salePrice,
    }));

    // Create new order
    const newOrder = {
      items: orderItems,
      user: user,
      orderDate: new Date(),
      address: userAddress,
      paymentMethod: paymentMethod,
      subtotal: cartSubtotal,
      processingFee: processingFee,
      total: grandTotal,
      
    };
    console.log("newOrder",newOrder)
    if (paymentMethod === 'COD' || paymentMethod === 'Wallet') {
      const createOrder = await orderModel.create(newOrder);

      if (couponCode) {
        const findCoupon = await isValidCoupon(couponCode, user, grandTotal);
        if (findCoupon.coupon) {
          const grandTotal = calculateCouponDiscount(findCoupon.coupon, createOrder.total);
          const [amountToPay, discountAmount] = [...grandTotal];
          createOrder.discount = discountAmount;
          await createOrder.save();
          await userCollection.findByIdAndUpdate(user, { coupons: findCoupon.coupon._id });
        }
      }

      if (createOrder) {
        // Update product quantities
        for (const item of orderItems) {
          const orderQuantity = item.quantity;
          await productCollection.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: -orderQuantity, sold: orderQuantity } }
          );
        }
        console.log('createOrder',createOrder)

                      
        await userCollection.findByIdAndUpdate(user, { $set: { cart: [] } });

        if (paymentMethod === "Wallet") {
          if (couponCode) {
            if (findCoupon.coupon) {
              await orderModel.findByIdAndUpdate(
                { _id: createOrder._id },
                { paymentMethod: 'Paid', amountPaid, amountToPay, walletPayment: amountToPay }
              );

              const description = 'Product Purchase';
              const type = 'debit';
              await decreaseWalletAmount(user, description, type, amountToPay);
            }
          } else {
            const walletpay = await orderModel.findByIdAndUpdate(
              { _id: createOrder._id },
              { paymentStatus: 'Paid', amountPaid: grandTotal, walletPayment: grandTotal },
              { new: true }
            );

            const description = 'Product Purchase';
            const type = 'debit';
            await decreaseWalletAmount(user, grandTotal, description, type);
          }

          return res.json({ walletSuccess: true, orderId: createOrder._id, payment: 'Wallet' });
        } else {
          return res.json({ codSuccess: true, orderId: createOrder._id, payment: 'COD' });
        }
      }
    } else if (paymentMethod == 'payWithWallet') {
      const createOrder = await orderModel.create(newOrder);
      if (couponCode) {
        const findCoupon = await isValidCoupon(couponCode, user, grandTotal);
        if (findCoupon.coupon) {
          const grandTotal = calculateCouponDiscount(findCoupon.coupon, createOrder.total);
          const [amountToPay, discountAmount] = [...grandTotal];
          createOrder.discount = discountAmount;
          await createOrder.save();
          await userCollection.findByIdAndUpdate(user, { coupons: findCoupon.coupon._id });
        }
      }
      const userdata = await userCollection.findById({ _id: user }).populate('wallet');
      let totalAmountToPay = walletAmount(userdata, grandTotal);
      if (findCoupon) {
        totalAmountToPay = amountToPay;
      }
      if (createOrder) {
        for (const item of orderItems) {
          const orderQuantity = item.quantity;
          await productCollection.findByIdAndUpdate(item.product, {
            $inc: { stock: -orderQuantity, sold: -orderQuantity }
          });
        }
      }
      generateRazorPay(totalAmountToPay, createOrder._id)
        .then((response) => {
          return res.json({ status: 'success', response, userdata });
        })
        .catch((err) => { console.log(err) });
    } else if (paymentMethod == 'RazorPay') { 
      const createOrder = await orderModel.create(newOrder);

      let totalAmountToPay = grandTotal;
      if (couponCode) {
        const findCoupon = await isValidCoupon(couponCode, user, grandTotal);
        if (findCoupon.coupon) {
          const grandTotal = calculateCouponDiscount(findCoupon.coupon, createOrder.total);
          const [amountToPay, discountAmount] = [...grandTotal];
          createOrder.discount = discountAmount;
          await createOrder.save();
          totalAmountToPay = amountToPay;
          await userCollection.findByIdAndUpdate(user, { coupons: findCoupon.coupon._id });
        }
      }

      if (createOrder) {
        for (const item of orderItems) {
          const orderQuantity = item.quantity;
          await productCollection.findOneAndUpdate(item.product, {
            $inc: { stock: orderQuantity, sold: -orderQuantity }
          });
        }

        const userdata = await userCollection.findOne({ _id: user });
        generateRazorPay(totalAmountToPay, createOrder._id)
          .then((response) => {
            return res.json({ status: 'success', response, userdata });
          })
          .catch((err) => { console.log(err) });
      }
    } else {
      res.render('users/pages/404');
    }
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ error: "Internal server error!" });
  }
};

//verify Payment

const verifyPayment = async (req, res) => {
  try {
    const user = req.userId;

    verifyingPayment(req.body)
      .then(async (details) => { // Mark the function as async
        console.log(details);
        const orderId = details.order.response.receipt;
        const amount = details.order.response.amount / 100;

        // Clear the cart once the promise is resolved
        await userCollection.findByIdAndUpdate(user, { $set: { cart: [] } });
        changePaymentStatus(orderId, user, amount)
          .then((changeStatus) => {
            console.log('status updated', changeStatus);
            console.log('Payment success');
            return res.json({ status: true, orderID: `${changeStatus._id}` });
          })
          .catch((err) => {
            console.log('Error in changing payment status:', err);
            res.json({ status: false, errMsg: 'Error in changing payment status' });
          });
      })
      .catch((err) => {
        console.log('Error in payment verification', err);
        res.json({ status: false, errMsg: 'Payment verification failed' });
      });
  } catch (error) {
    console.error(error);
    res.json({ status: false, errMsg: 'An error occurred' });
  }
};




//payment failed 

const paymentFailed = async(req,res)=>{
  try {

    const order = req.body.order.response;
        const orderId = order.receipt;

        const findOrder = await orderModel.findById({ _id: orderId }).populate('items.product');

        console.log("findOrder",findOrder)

        if (findOrder) {
            const orderItems = findOrder.items;

            for (const item of orderItems) {
                const orderQuantity = item.quantity;

                const product = await productCollection.findById(item.product);
                if (item.status !== 'Cancelled') {
                    if (product) {
                        item.status = 'Cancelled'; // Update the status of the item
                        const proId = item.product._id

                        await productCollection.findByIdAndUpdate(proId,
                            { $inc: { quantity: orderQuantity, sold: -orderQuantity } }
                        );
                    }
                }
            }
            await findOrder.save();
        }

        res.json({ status: true });

    
  } catch (error) {

    console.error(error)
    
  }
}


// orderPlaced page
const orderPlacedPage = async (req, res) => {
  try {
    const orderId = req.query.id;
    console.log("order id", orderId);

    if (!orderId) {
      console.error("Order ID is missing");
      return res.status(400).send("Order ID is missing");
    }

    const findOrder = await orderModel.findById(orderId).populate("address");

    if (!findOrder) {
      console.error("Order not found");
      return res.status(404).send("Order not found");
    }

    console.log(findOrder);

    res.render("users/pages/orderPlacedPage", {
      orderId:orderId,
      order: findOrder,
      address: findOrder.address,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};

const orders = async (req, res) => {
  try {
    const user = req.userId;
    const orderItems = await orderModel.find({ user:user})
        .populate({
            path: 'items.product',
            model: 'productCollection',
            populate: {
                path: 'images',
            },
        })
        .populate('address')
        .sort({ orderDate: -1 });

    res.render('users/pages/orders', { orders: orderItems });

} catch (error) {
    console.error(error);
}
};

const viewOrderList = async (req, res) => {
  try {
    const user = req.userId
    const viewlistOrder = await orderModel
      .find({user:user.email})
      .populate({
        path: "items.product",
        model: "productCollection",
      })

      .sort({ orderDate: -1 });

    res.render("users/pages/viewOrderList", {
      title: "Orders",
      orders: viewlistOrder,
      getStatusClass,
    });
  } catch (error) {
    console.error(error);
  }
};

const viewOrderPage = async (req, res) => {
  try {
    const orderId = req.params.id;
    const productId = req.body.productId;
    

    console.log("orderId",req.body, orderId);

    const order = await orderModel
      .findOne({ _id: orderId })
      .populate({
        path: "items.product",
        model: "productCollection",
        populate: {
          path: "images",
        },
      })
      .populate("address")
      .populate("user")

    const productIdString = String(productId); //finding matching productId from orderDb
    const productItem = order.items.find(item => String(item.product._id) === productIdString);
    console.log('productItem',productItem);
    console.log('productId',productId)

    if (productItem) {
      // if there is product
      const matchedProduct = productItem.product;
      const quantity = productItem.quantity;
      const salePrice = productItem.salePrice;
      const status = productItem.status;
      res.render("users/pages/viewOrderPage", { order, product: matchedProduct, quantity, salePrice, status });
    } 
  } catch (error) {
    console.error(error);
  }
};

const orderStatus = async (req, res) => {
  try {
    res.render("users/pages/orderStatus");
  } catch (error) {
    console.error(error);
  }
};

const cancelOrder = async (req, res) => {
  try {
      console.log('Request received for Cancelling Order');
      const user = req.userId;
      const orderId = req.params.id;
      const productId = req.body.productId
      const newStatus = req.body.newStatus
      const order = await orderModel.findOne({ _id: orderId })
          .populate({
              path: 'items.product',
              model: 'productCollection'
          })
          .populate('address');

      const productIdString = String(productId); //finding matching productId from orderDb
      const productItem = order.items.find(item => String(item.product._id) === productIdString);

      if (!productItem) {
          return res.status(404).render('users/pages/404');
      } else {
          if (productItem.status !== 'cancelled') {
              if (order.paymentMethod == 'RazorPay' && order.paymentStatus == 'Paid'
                  || (order.paymentMethod == 'PaywithWallet' && order.paymentStatus == 'Paid' ||
                      order.paymentMethod == 'Wallet'
                  )) {

                    let price = productItem.salePrice 

                  
                  if (order.discount > 0) {
                      if (order.items.length > 1) {
                          price = productItem.salePrice - (order.discount / order.items.length)
                          console.log('inside  discount price', price);
                      } else {
                        price = productItem.salePrice - order.discount;
                      }
                  }
                  const user = req.userId
                  const description = 'Order Cancelled';
                  const type = 'credit'
                  const salePrice = await decreaseQuantity(orderId, productId); // Get the salePrice from decreaseQuantity
                  await updateWalletAmount(user, salePrice, description, type)
              } else {  
                  console.log("wallet not updated")
              }

              productItem.status = newStatus
              const incQuantity = productItem.quantity

              await productCollection.findByIdAndUpdate(productId,
                  { $inc: { quantity: incQuantity, sold: -incQuantity } });

              await order.save();
              return res.redirect(`/myorders`);
          } else {
              res.render('users/pages/404')
          }
      }

  } catch (error) {
      console.error(error);
  }
};

// return request from user--
const returnProduct = async (req, res) => {
  try {
      const orderId = req.params.id;
      const productId = req.body.productId;
      const findOrder = await orderModel.findOne({ _id: orderId })
      console.log(findOrder)

      const productIdString = String(productId); //finding matching productId from orderDb
      const productItem = findOrder.items.find(item => String(item.product._id) === productIdString);

      if (productItem) {
          productItem.status = 'Return requested';
          productItem.returnDate = Date.now()
          await findOrder.save();
          res.redirect('/myorders')
      } else {
          res.render('users/pages/404')
      }
  } catch (error) {
      console.error(error);
  }
};


//download Invoice 

const downloadInvoice = async (req, res) => {
  try {
      const orderId = req.params.id;

      const docDefinition = await generateInvoice(orderId)
      const pdfMake = require('pdfmake/build/pdfmake');
      const vfsFonts = require('pdfmake/build/vfs_fonts');
      pdfMake.vfs = vfsFonts.pdfMake.vfs;

      // Create a PDF document
      const pdfDoc = pdfMake.createPdf(docDefinition);
      // Generate the PDF and send it as a response
      pdfDoc.getBuffer((buffer) => {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=invoice-${orderId}.pdf`);

          res.end(buffer);
      });



  } catch (error) {
      console.error(error);
  }
};

module.exports = {
  checkoutPage,
  orderPlacedPage,
  placeOrder,
  checkCart,
  orders,
  viewOrderList,
  viewOrderPage,
  orderStatus,
  cancelOrder,
  updateWalletInCheckout, 
  applyCoupon,
  paymentFailed,
  verifyPayment,
  returnProduct,
  downloadInvoice,
  couponDetails

};