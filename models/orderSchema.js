  const mongoose = require("mongoose");


  const orderSchema = new mongoose.Schema({
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "productCollection",
        },
        quantity: Number,
        salePrice: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "productCollection",
        },
        status: {
          type: String,
          enum: [
            "Pending",
            "Shipped",
            "Delivered",
            "Cancelled",
            "Return requested",
            "Refunded",
          ],
          default: "Pending",
        },
        returnDate: Date,
      },
    ],

    user: { type: mongoose.Schema.Types.ObjectId, ref: "userCollection" },
    
    orderId: {
      type: String,
      default: function () {
        return `ORD-${new Date().getTime().toString()}-${Math.floor(
          Math.random() * 10000
        )
          .toString()
          .padStart(4, "0")}`;
      },
      unique: true,
    },

    orderDate: {
      type: Date,
      default: Date.now(),
    },

    estimatedDelivery: {
      type: Date,
      required: true,
      default: function () {
        const deliveryDate = new Date(this.orderDate);
        deliveryDate.setDate(this.orderDate.getDate() + 5);
        return deliveryDate;
      },
    },

    shippedDate: Date,

    deliveredDate: Date,

    address:Object,

    paymentMethod: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      default: "Pending",
    },
    walletPayment: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },

    processingFee: Number,

    discount: Number,

    subtotal: Number,
    
    total: Number,
  });

  module.exports = mongoose.model("orderModel", orderSchema);
