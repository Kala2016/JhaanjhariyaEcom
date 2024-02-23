// const mongoose = require("mongoose");

// const cartSchema = new mongoose.Schema(
//   {
  
//     user_id:{
//         type:mongoose.Types.ObjectId,
//         required:true,
//         ref:"user"
//     },
//     coupon:{
//         type:String
//     },
//     discount:{
//         type:Number
//     },
//     items:[
//         {
//             product_id:{
//                 type:mongoose.Types.ObjectId,
//                 required:true,
//                 ref:"product"
//             },
//             variant_id:{
//                 type:mongoose.Types.ObjectId,
//                 required:true,
//                 ref:"variant"
//             },
//             quantity:{
//                 type:Number,
//                 required:true
//             }
//         }
//     ]
// },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Cart", cartSchema);