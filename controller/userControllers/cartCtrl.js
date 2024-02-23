const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const variant =require("../../models/variantSchema")
// const Cart = require("../../models/cartSchema");
const { ObjectId } = require("mongodb");

//cart page

const getCartPage = async (req, res) => {
  try {
    const cart = await userCollection.findOne({ user_id: req.session.userId });

    if (!cart) {
      console.log("Cart not found for user:", req.session.userId);
      return res.status(404).send("Cart not found");
    }

    console.log("Cart", cart);

    res.render("./users/pages/shopping-cart", {
      cart: cart,
      items: productCollection.items,
    });
  } catch (error) {
    console.error("Error in getCartPage", error);
    res.status(500).send("Internal Server Error");
  }
};

//add to cart
const addtoCart = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const ID = req.session.user._id;
    console.log("id===", req.session.user._id);

    const { productId, variantId, quantity } = req.body;

    // Check if variantId is provided
    if (!variantId) {
      return res.status(400).json({ message: "Variant ID is required" });
    }

    // Check if the variant ID is valid
    const variantExists = await VariantModel.exists({ _id: variantId });
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
            product_id: productId,
            variantId: variantId,
            quantity: quantity,
          },
        },
      },
      { new: true }
    );

    console.log("Cart Updated:", cartUpdated);

    if (cartUpdated) {
      return res.redirect("/users/pages/shopping-cart");
    } else {
      return res.status(400).json({ message: "Couldn't update Cart", success: false });
    }
  } catch (error) {
    console.error("Error in Cart", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};


//product add to cart
// const productAddtoCart = async (req, res) => {
//   try {
//     console.log("Inside productAddtoCart function");

//     const ID = new ObjectId(req.session.userid);
//     console.log("UserID:", ID);

//     const productId = new ObjectId(req.body.product);
//     console.log("ProductID:", productId);

//     const variantIndex = new ObjectId(req.body.variant);
//     console.log("VariantIndex:", variantIndex);

//     const quantity = req.body.quantity;
//     console.log("Quantity:", quantity);

//     const variantId = (
//       await productCollection.findById(productId).populate("variants")
//     ).variants[variantIndex]._id;
//     console.log("VariantID:", variantId);

//     // Check if the item is already in the cart (you might need to define `alreadyIn` variable)
//     if (alreadyIn) {
//       console.log("Item is already in the cart");
//       return res.status(409).json({ message: "Item already in Cart!", success: false });
//     } else {
//       console.log("Item is not in the cart");

//       const cartUpdated = await productCollection.updateOne(
//         { user_id: ID },
//         {
//           $push: {
//             items: {
//               product_id: productId,
//               variantId: variantId,
//               quantity: quantity,
//             },
//           },
//         },
//         { new: true }
//       );

//       if (cartUpdated) {
//         console.log("Cart updated successfully");
//         return res.status(200).json({ message: "Cart updated successfully", success: true });
//       } else {
//         console.log("Failed to update cart");
//         return res.status(400).json({ message: "Failed to update cart", success: false });
//       }
//     }
//   } catch (error) {
//     console.error("Error in productAddtoCart function:", error);
//     return res.status(500).json({ message: "Internal server error", success: false });
//   }
// };

// module.exports = {
//   productAddtoCart,
// };

// Update Cart

const updateCart = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    const body = req.body;
    const id = new ObjectId(req.body.id);
    const userId = new ObjectId(req.session.userid);
    const cartItem = new userCollection.findOneAndUpdate(
      { user_id: userId, "items.product_id": id },
      { $set: { "items.$.quantity": body.quantity }, upsert: true }
    );
    console.log("Updated Cart items:", cartItem);

    if (cartItem) {
      res
        .status(200)
        .json({ message: "Cart quantity updated succesfully!", success: true });
    } else {
      res
        .status(200)
        .json({ message: "Cart quantity updation failed!", success: false });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal srver Error");
  }
};

module.exports = {
  getCartPage,
  addtoCart,
  //productAddtoCart,
  updateCart,
};
