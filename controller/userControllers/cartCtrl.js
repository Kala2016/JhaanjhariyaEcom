
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

      if (!cart || !cart.cart || cart.cart.length === 0) {
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
    const { productId, variantId } = req.body;
    const { quantity = 1 } = req.query;
    const userId = req.session.user._id;

    // Check if variantId is provided
    if (!variantId) {
      req.flash('error', 'Variant ID is required');
      return res.status(400).json({ message: 'Variant ID is required' });
    }

    const variant = await Variant.findById(variantId);
    const variantExists = await Variant.exists({ _id: variantId });

    // Check if the variant ID is valid
    if (!variantExists) {
      req.flash('error', 'Variant not found');
      return res.status(404).json({ message: 'Variant not found' });
    }

    const alreadyIn = await userCollection.findOne({
      _id: userId,
      'cart.variantId': variantId,
    });

    if (alreadyIn) {
      req.flash('error', 'Item already in Cart');
      return res.status(409).json({ message: 'Item already in Cart' });
    }

    const cartUpdated = await userCollection.findByIdAndUpdate(
      userId,
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

    req.flash('success', 'Product added to cart');
    return res.status(200).json({ message: 'Product added to cart' });
  } catch (error) {
    console.error('Error in Cart', error);
    req.flash('error', 'Internal Server Error');
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
  




const updateCart = async (req, res) => {
  try {
    const  productId  = req.params.id;  
    const newQuantity = parseInt(req.body.quantity);
    const user = req.session.user._id ;

    console.log('user56789',user);
    const userData = await userCollection.findOne({_id : user}).populate(
       "cart.productId")
    console.log('User Data>',userData);

    const cartItem = userData.cart.find(cartItem => cartItem._id.toString()===productId)

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    


    
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
    console.log(error);
      res.status(500).json('Internal Server Error')
  }
};


const checkProductAvailability = async (req, res) => {
  try {
      const userId = req.userId;
      const user = await userCollection.findById(userId).populate('cart.productId').populate('cart.variantId').exec(); // Populate the product details
      const cartItems = user.cart;

      res.json({ cartItems });
  } catch (error) {
      console.error(error)
  }
};


//counting cart items--

const getCartCount = async (req, res) => {
    try {
      console.log(req.userId)
      console.log('akjshajsdfashf')
        if (req.userId) {
            // Get the user's cart items count from your user model
            const userId = req.userId;
            const user = await userCollection.findById(userId).exec();
            const cartItemCount = user.cart.length;
            res.json({success:true, cartItemCount }); // Use the correct property name
        } else {
            // User is not authenticated
            res.json({success:false, cartItemCount: 0 }); // Return 0 if the user is not logged in
        }
    } catch (error) {
        throw new Error(error);
    }
};











module.exports = {
  getCartPage,
  addtoCart,
  updateCart,
  removeProductfromCart,
  checkProductAvailability,
  getCartCount
  

};
