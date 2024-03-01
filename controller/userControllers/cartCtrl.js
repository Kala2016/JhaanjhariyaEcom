const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const Variant = require("../../models/variantSchema");
const { ObjectId } = require("mongodb");

//cart page

const getCartPage = async (req, res) => {
  try {
    const id = req.userId;
    const cart = await userCollection
      .findOne({ _id: id })
      .populate({
        path: "cart.productId",
        populate: { path: "images" },
      })
      .populate("cart.variantId");
      console.log("cartData ", cart.cart);

    if (cart.cart.length === 0) {
      // When user has an empty cart
      res.render("./users/pages/shopping-cart", { cart: [], total: 0 });
      // console.log("Cart not found for user:", req.session.userId);
      // return res.status(404).send("Cart not found");
    } else {
      const userCart = cart.cart;

      // Calculate subtotal
      
      const subtotal = userCart.reduce((total, cartitem) => {
        return total + cartitem.productId.salePrice * cartitem.quantity; // Fixed the calculation here
      }, 0);
      console.log('subtotal',subtotal)

      res.render("./users/pages/shopping-cart", { cart: userCart,subtotal }); // Passed userCart and subtotal as variables to the template
    }

  } catch (error) {
    console.error(error)
  }
};


const addtoCart = async (req, res) => {
  try {
    //const { productId, variantId, quantity } = req.body; // Define variantId here
    const { id: productId } = req.params;
    const { id: variantId } = req.params;
    const { quantity = 1 } = req.query;

    console.log(
      "Request Body:===========================================",
      req.body
    );
    const ID = req.session.user._id;
    console.log("id===", req.session.user._id);

    console.log("variantId", variantId);

    const variant = await Variant.findById(variantId); // Use the Variant model
    const variantExists = await Variant.exists({ _id: variantId }); // Use the Variant model

    // Check if variantId is provided
    if (!variantId) {
      return res.status(400).json({ message: "Variant ID is required" });
    }

    // Check if the variant ID is valid
    if (!variantExists) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const alreadyIn = await userCollection.findOne({
      _id: ID,
      "cart.variantId": variantId,
    });

    console.log("Already in Cart:", alreadyIn);

    if (alreadyIn) {
      return res.status(409).json({ message: "Item already in Cart" });
    }

    const cartUpdated = await userCollection.findByIdAndUpdate(
      ID,
      {
        $push: {
          cart: {
            productId,
            variantId,
            quantity,
          },
        },
      },
      { new: true }
    );

    console.log("Cart Updated:", cartUpdated);

    if (cartUpdated) {
      return res.status(200).redirect("/shopping-cart");
    } else {
      return res
        .status(400)
        .json({ message: "Couldn't update Cart", success: false });
    }
  } catch (error) {
    console.error("Error in Cart", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

// Update Cart

// const updateCart = async (req, res) => {
//   try {
//     console.log("Request Body:", req.body);
//     const body = req.body;
//     const id = new ObjectId(req.body.id);
//     const userId = new ObjectId(req.session.userid);
//     const cartItem = new userCollection.findOneAndUpdate(
//       { user_id: userId, "cartitem.product_id": id },
//       { $set: { "cartitem.$.quantity": body.quantity } }
//     );
//     console.log("Updated Cart items:", cartItem);

//     if (cartItem) {
//       res
//         .status(200)
//         .json({ message: "Cart quantity updated succesfully!", success: true });
//     } else {
//       res
//         .status(200)
//         .json({ message: "Cart quantity updation failed!", success: false });
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal srver Error");
//   }
// };

const updateCart = async (req,res)=>{
  try {
    const { id: productId } = req.params;
    const newQuantity= parseInt(req.body.quantity);

    const user = req.user;

    const cartItem = user.cart.find(cartItem=>cartItem.productId.equals(productId));

    if(!cartItem){

      console.error(error)

    }


    const product = await productCollection.findById(productId)

    if (newQuantity >product.quantity){
      const message ="Out of Stock"
      return res.json({success:false,message })
      
    }

    cartItem.quantity =newQuantity;
    await user .save();

    const currentCart = await userCollection.findById(user._id).populate("cart.productId").populate("cart.variantId");
    const cartItems = currentCart.cart

    let totalPrice = 0;
    cartItems.forEach(cartItem => {
      const product = cartItem.productId;
      const variant = cartItem.variantId;
      const quantity = cartItem.quantity;

      const productPrice = product.variant.salePrice;
      totalPrice += productPrice * quantity;
  });

  res.json({success: true ,totalPrice});
    
  } catch (error) {

    console.error("Error in updating Cart item quantity",error)
    res.status(500).json({success: false ,error :'Error in updating Cart item quantity'})
    
  }
}


const removeProductfromCart = async(req,res)=>{
  try {

    const user = req.user
    const removeProduct = await user.removeFromCart(productId)
    if(removeProduct){
      res.redirect('/shopping-cart')
    }else{
      console.log('Error in removing the Product from the Cart');
    }
    
  } catch (error) {

    console.log(error)
    
  }
}




module.exports = {
  getCartPage,
  addtoCart,
  updateCart,
  removeProductfromCart
};
