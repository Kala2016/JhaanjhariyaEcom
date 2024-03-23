const orderModel = require("../../models/orderSchema");
const { order: orderStatus, order } = require("../../config/enum");
const productCollection = require("../../models/ProductSchema");
const userCollection = require("../../models/userSchema");



const ordersPage = async (req, res) => {
  try {

      const listOrder = await orderModel.find().populate({
          path: 'items.product',
          model: 'productCollection'
      })
          .sort({ orderDate: -1 });

      res.render('./admin/pages/orders', { title: 'Orders', orders: listOrder })
  } catch (error) {
      console.error(error)
  }
}


const editOrderPage = async (req, res) => {
  try {
      const orderId = req.params.id
      console.log('orderid', orderId);
      const findOrder = await orderModel.findOne({ _id: orderId })
          .populate({
              path: 'items.product',
              model: 'productCollection',
              populate: {
                  path: 'images',
              },
          })
          .populate('address')
          .populate('user')

          console.log('findOrder', findOrder);
      res.render('./admin/pages/editOrder',{viewOrder:findOrder} )
  } catch (error) {
      console.error(error)
  }
}



// update Order status  , return product , refund and credit amount to wallet--
const updateOrder = async (req, res) => {
  try {
      const orderId = req.params.id;
      const status = req.body.status;
      const productId = req.body.productId;
      console.log('status when admin update order', status);

      const update = await orderModel.findOneAndUpdate(
          { _id: orderId, 'items.product': productId }, // Match the order and the product
          { $set: { 'items.$.status': status } } // Update the status of the matched product
      );
      if (status == 'Shipped') { // Update shippedDate date

          await orderModel.findOneAndUpdate(
              { _id: orderId },
              { $set: { shippedDate: new Date() } }
          );
      } else if (status == 'Delivered') { // Update delivered date
          if (update.paymentStatus == '') { }
          await orderModel.findOneAndUpdate(
              { _id: orderId },
              { $set: { deliveredDate: new Date(), paymentStatus: 'Paid' } }
          );
      } else { }

      if (update) { //if update is success            
          console.log('inside if updated ');
          if (status == 'Cancelled' && update.paymentMethod == 'COD') { //if the admin updates the status to cancelled ,increase the quantity.
              decreaseQuantity(orderId, productId)

          } else if (status == 'Cancelled' && (update.paymentMethod == 'RazorPay'
              || update.paymentMethod == 'Wallet' || update.paymentMethod == 'WalletWithRazorpay')) {

              let productPrice = await decreaseQuantity(orderId, productId);
              const userId = update.user;
              const description = 'Order Cancelled';
              const type = 'credit'

              if (update.discount > 0) {
                  if (update.items.length > 1) {
                      productPrice -= (update.discount / update.items.length)
                  } else {
                      productPrice -= update.discount;
                  }
              }
              updateWalletAmount(userId, productPrice, description, type)

          } else if (status == 'Refunded') {
              // increase the quantity and decrease sold , returns the product price
              let productPrice = await decreaseQuantity(orderId, productId);
              const userId = update.user;
              const description = 'Refund';
              const type = 'credit'

              if (update.discount > 0) {
                  if (update.items.length > 1) {
                      productPrice -= (update.discount / update.items.length)
                  } else {
                      productPrice -= update.discount;
                  }
              }

              updateWalletAmount(userId, productPrice, description, type)
          } else {
              console.log('NOthing in updating');
          }

          res.redirect('/admin/orders')
      } else {
          res.status(404).render('./admin/404');
      }

  } catch (error) {
      console.error(error)
  }
}


module.exports = {
  ordersPage,
  editOrderPage,
  updateOrder


}