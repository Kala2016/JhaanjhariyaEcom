const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const productCollection = require('../models/ProductSchema')

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
  cart:[
    {
        product_id:{
            type:mongoose.Types.ObjectId,
            required:true,
            ref:"product"
        },
        variant_id:{
            type:mongoose.Types.ObjectId,
            required:true,
            ref:"variant"
        },
        quantity:{
            type:Number,
            required:true
        }
    }
]
  
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

  const existingCartItem = this.cart.find(item => item.product.equals(product._id,variant._id));

  if (existingCartItem) {
      // If the product already exists in the cart, update the quantity
      existingCartItem.quantity += quantity; // Increment the quantity
  } else {
      // this.cart.push({ product: product._id, quantity }); // If not in the cart, add as a new item
      this.cart.push({ product: product._id,variant_id, quantity: 1 });
  }

  await this.save();
  return true; // Successfully updated cart
};






const userCollection = mongoose.model("userCollection", userSchema);


module.exports = userCollection;


