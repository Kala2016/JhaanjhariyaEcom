const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const { calculateSubtotal } = require("../../utility/ordercalcalculation");
const orderModel = require("../../models/orderSchema");
const { checkCartItemsMatch } = require("../../helpers/checkCartHelper");

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

    // Render the checkout page with data
    res.render("users/pages/checkoutPage", {
      cartItem,
      cartSubtotal,
      processingFee,
      grandTotal,
      address,
    });

    console.log("cartItem---:", cartItem);
    console.log("grandTotal---:", grandTotal);
    console.log("cartSubtotal---", cartSubtotal);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const placeOrder = async (req, res) => {
  try {
    const user = req.userId;
    const { address, paymentMethod } = req.body;

    // Retrieve user data with cart
    // const userWithCart = await userCollection.findById(user);
    const userWithCart= await userCollection
      .findById(user)
      .populate("cart.productId")
      .populate("cart.productId.salePrice");


    const findAddress = await userCollection.findOne(
        { _id: user, 'addresses._id': address },
        { 'addresses.$': 1 }
    );  
        const userAddress = findAddress.addresses[0]
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

    const createOrder = await orderModel.create(newOrder);

    console.log("order created---->", createOrder._id);

    // Update product quantities
    for (const item of orderItems) {
      const orderQuantity = item.quantity;
      await productCollection.findByIdAndUpdate(
        item.productId, // Corrected the field name
        { $inc: { quantity: -orderQuantity, sold: orderQuantity } }
      );
    }

    // Clear user's cart
    await userCollection.findByIdAndUpdate(user, { $set: { cart: [] } });

    // Redirect to order placed page
    return res.redirect(`/orderPlacedPage?id=${createOrder._id}`); // Sending success response
  } catch (error) {
    console.error("Error occurred:", error);
    return res.status(500).json({ error: "Internal server error!" }); // Sending error response
  }
};

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
    const user = req.session.userId;
    const orderItems = await orderModel
      .find({ user: user })
      .populate({
        path: "items.product",
        model: "Product",
        populate: {
          path: "images",
        },
      })
      .populate("address")
      .sort({ orderDate: -1 });

    res.render("users/pages/viewOrderPage", { orders: orderItems });
  } catch (error) {
    console.error(error);
  }
};

const viewOrder = async (req, res) => {
  try {
      const orderId = req.params.id;
      const productId = req.body.productId

      const order = await orderModel.findOne({ _id: orderId })
          .populate({
              path: 'items.product',
              model: 'Product',
              populate: {
                  path: 'images',
              },
          })
          .populate('address');

      const productIdString = String(productId); //finding matching productId from orderDb
      const productItem = orderModel.items.find(item => String(item.productId) === productIdString);

      if (productItem) { // if there is product 
          const matchedProduct = productItem.product;
          const quantity = productItem.quantity
          const salePrice = productItem.salePrice
          const status = productItem.status
          res.render('/users/pages/viewOrder', { order, product: matchedProduct, quantity, salePrice, status })
      } else {
          res.render('/users/pages/404')
      }
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
  viewOrder
};
