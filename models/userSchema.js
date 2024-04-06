const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productCollection = require('../models/ProductSchema')
const variant = require("../models/variantSchema")
const address = require("../models/addressSchema")
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const userSchema = new Schema({


  fname: {
    required: true,
    type: String,
  },
  lname: {
    required: true,
    type: String,
  },
  email: {
    required: true,
    type: String,
    unique: true,
  },
  mobile: {
    required: true,
    type: Number,
    unique: true,
  },
  password: {
    required: true,
    type: String,
  },
  is_Blocked: {
    type: Boolean,
    default: false,  
  },
  status:{
    type:String,
  },
  salt: String,

  image_url:{
    type:String,
    default:"1.png"
  },
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'address' }],addresses:[address.schema],

  wishlist: [
    { type: mongoose.Schema.Types.ObjectId, ref: "productCollection" },
  ],

  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },

  coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
  
  cart:[
    {
        productId:{
            type:mongoose.Types.ObjectId,
            required:true,
            ref:"productCollection"
        },
        variantId:{
            type:mongoose.Types.ObjectId,
            required:true,
            ref:"variant"
        },
        quantity:{
            type:Number,
            required:true
        }
    }
],


  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
  
}, { timestamps: true });


userSchema.methods.addToCart = async function (productId,variantId,quantity) {
  const product = await productCollection.findById(productId); 
  const variant =await variant.findById(variantId)// Find the product by its ID
  if (!product||variant) {
      throw new Error('Product /Variant not found');
  }
  if (quantity > product.quantity) {

      throw new Error('Not enough stock available');
  }

  // const existingCartItem = this.cart.find(item => item.product.equals(product._id,variant._id));

  if (existingCartItem) {
      // If the product already exists in the cart, update the quantity
      existingCartItem.quantity += quantity; // Increment the quantity
  } else {
      // this.cart.push({ product: product._id, quantity }); // If not in the cart, add as a new item
      this.cart.push({ product: productId,variantId, quantity: 1 });
  }

  await this.save();
  return true; // Successfully updated cart
};


userSchema.pre('save', async function (next) {
  if (this.isNew) {
      const salt = bcrypt.genSaltSync(10);
      this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  // Checking for matching password
  return await bcrypt.compare(enteredPassword, this.password);
};

// resetPassword
userSchema.methods.createResetPasswordToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};


userSchema.methods.removeFromCart = function (productId) {
  // Remove an item from the cart by product ID
  this.cart = this.cart.filter(cartItem => !cartItem.product.equals(productId));
  return this.save();
};

userSchema.methods.clearCart = function () {
  // Clear the entire cart
  this.cart = [];
  return this.save();
};  



module.exports = mongoose.model('userCollection', userSchema);
