const mongoose = require("mongoose");

var ProductSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    
    categoryName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CategoryCollection",
    },
    collectionName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionModel",
    },
    sold: {
      type: Number,
      default: 0,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Images",
      },
    ],        
    isListed: {
      type: Boolean,
      default: true,
    },
    salePrice:{
        type:Number,
        default:0
    },
    createdOn:{
        type:Date,
        default:Date.now
    },
    variants:[{
            type:mongoose.Schema.Types.ObjectId,
            ref:"variant"
    }],
    
  },
  
  { timestamps: true }
);

// Export the model
const productCollection = mongoose.model("productCollection", ProductSchema);

module.exports = productCollection;
