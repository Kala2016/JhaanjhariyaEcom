const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const Variant = require("../../models/variantSchema");
const { ObjectId } = require("mongodb");
const { userLoggedIn } = require("../../middlewares/userAuth");
const { calculateSubtotal } = require("../../utility/ordercalcalculation");


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

    if (cart.cart.length === 0) {
      // When user has an empty cart
      return res.render("./users/pages/shopping-cart", { cart: [], subtotal: 0, grandTotal: 0});
    }

    const userCart = cart.cart;

    // Calculate subtotal
    const subtotal = userCart.reduce((total, cartitem) => {
      return total + cartitem.productId.salePrice * cartitem.quantity;
    }, 0);

    // Use subtotal as salesPrice
    const salesPrice = subtotal;

    const grandTotal = subtotal;

    res.render("./users/pages/shopping-cart", { cart: userCart, subtotal, grandTotal, salesPrice });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


const addtoCart = async (req, res) => {
  try {
    //const { productId, variantId, quantity } = req.body; // Define variantId here
    const { productId, variantId } = req.body;

    const { quantity = 1 } = req.query;

 
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



const updateCart = async (req, res) => {
  try {
    const  productId  = req.params.id;
    const newQuantity = parseInt(req.body.quantity);
    const user = req.session.user._id
    console.log('user56789',user);
    const userData = await userCollection.findOne({_id : user}).populate(
       "cart.productId")
    console.log('User Data>>>',userData);

    const cartItem = userData.cart.find(cartItem => cartItem._id.toString()===productId)


    
    console.log("cartItem",cartItem)

    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Cart item not found" });
    }

    const product = await productCollection.findById(cartItem.productId);

    if (newQuantity > product.quantity) {
      const message = "Out of Stock";
      return res.json({ success: false, message });
    }

    cartItem.quantity = newQuantity;
    await userData.save();

    let totalPrice = 0;
    userData.cart.forEach((cartItem) => {
      const quantity = cartItem.quantity;
      const productPrice = cartItem.productId.salePrice; // Adjust according to your data structure
      totalPrice += productPrice * quantity;
    });

    res.json({ success: true, totalPrice });
  } catch (error) {
    console.error( error);
    // res.status(500).json({ success: false, error: "Error in updating Cart item quantity" });
  }
};


const removeProductfromCart = async (req, res) => {
  try {
    var user = req.session.user;
    var User = await userCollection.findById(user._id)
console.log(req.userId,'ddddddddddddd')
    const productId = req.params.id;
    console.log(productId); // productId is sent as a route parameter
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    User.cart = User.cart.filter(cartItem => cartItem._id.toString() !== productId);
    console.log('Updated cart:', user.cart); // Check if cart is updated correctly
    await User.save();
    
    res.redirect("/shopping-cart");
    
      
    
  } catch (error) {
    console.log(error.message);
      res.status(500).json('Internal Server Error')
  }
};


const checkProductAvailability = async (req, res) => {
  try {
      const userId = req.user.id;
      const user = await userCollection.findById(userId).populate('cart.productId').populate('cart.variantId').exec(); // Populate the product details
      const cartItems = user.cart;

      res.json({ cartItems });
  } catch (error) {
      console.error(error.message)
  }
};









module.exports = {
  getCartPage,
  addtoCart,
  updateCart,
  removeProductfromCart,
  checkProductAvailability,

};
