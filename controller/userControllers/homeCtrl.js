const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const CategoryCollection = require("../../models/categorySchema");
const CollectionModel = require("../../models/collectionSchema");
// const Cart = require("../../models/cartSchema");
const { ObjectId } = require("mongodb");
const variant= require("../../models/variantSchema");

// Load Home Page
const getUserRoute = async (req, res) => {
  try {
    const user = req.session.user;
    const loggedIn = req.session.loggedIn;
    const category = await CategoryCollection.find();
    const cart = await userCollection.find();
    const products = await productCollection
      .find()
      .populate("productName")
      .populate("images")
      .populate("variants")
      .populate("categoryName")
      .populate("collectionName");

    console.log(user, "sdfgsdfg");
    console.log(products, "ijnoknknn");
    console.log(cart, "cart data");

    res.render("./users/pages/home", {
      products: products,
      cart: cart,
    });
  } catch (error) {
    console.error(error);
  }
};

// logout
const getLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect("/login"); // Redirect to login page after logout
    });
  } catch (error) {
    console.log(404);
  }
};

const getShoppingpage = async (req, res) => {
  try {
    console.log(req.query);
    let salePrice = 0;
    const category = await CategoryCollection.find({ isListed: true });
    const collection = await CollectionModel.find();
    const cart = await userCollection.findOne(
      { user_id: "userid" },
      { upsert: true }
    );
    console.log("Cart ==", cart);

    const cartitem = cart ? cart.item : ["No cart"];
    console.log("Cart items", cartitem);

    const variants = await productCollection.find();

    const catId = category.find(
      (cat) => cat.categoryName === req.query.category
    )?._id;
    const filter = { isListed: true };

    if (req.query.category) {
      filter.categoryName = catId;
    }
    console.log("category", category);

    const collId = collection.find(
      (coll) => coll.collectionName === req.query.collection
    )?._id;

    if (req.query.collection) {
      filter.collectionName = collId;
    }

    const products = await productCollection
      .find(filter)
      .populate("productName")
      .populate("images")
      .populate("categoryName")
      .populate("collectionName")
      .populate("variants")
      .populate("salePrice");

    res.render("./users/pages/shop", {
      products: products,
      category: category,
      collection: collection,
      variants: variants,
      selectedCategory: req.query.category,
      selectedCollection: req.query.collection,
      salePrice: salePrice,
    });

    // console.log("selectedCategory", selectedCategory);
  } catch (error) {
    console.error(error);
  }
};

const getproductpage = async (req, res) => {
  try {
    const id = req.params.id;
    const user = req.user;

    const category = await CategoryCollection.find({ isListed: true });
    const collection = await CollectionModel.find();
    const cart = await productCollection.findOne({
      user_id: req.session.userId,
    });
    const cartitem = cart ? cart.item : ["No cart"];

    const catId = category.find(
      (cat) => cat.categoryName === req.query.category
    )?._id;
    const filter = { isListed: true };

    if (req.query.category) {
      filter.categoryName = catId;
    }

    const collId = collection.find(
      (coll) => coll.collectionName === req.query.collection
    )?._id;

    if (req.query.collection) {
      filter.collectionName = collId;
    }
    let salePrice = 0;
    const products = await productCollection
      .findOne({ _id: id })
      .populate("categoryName")
      .populate("images")
      .populate("collectionName")
      .populate("salePrice")
      .populate("variants");

    const initialVariant = products.variants[0];

    console.log(initialVariant, "initialVariant");

    // ? console.log("products ", products);

    const relatedProducts = await productCollection
      .find({ categoryName: products.categoryName, _id: { $ne: id } })
      .populate("images")
      .populate("collectionName")
      .populate("categoryName")
      .populate("salePrice")
      .limit(4);

    console.log("relatedProducts", relatedProducts);

    if (!products) {
      return res.status(404).render("./shop/pages/404");
    } else {
      res.render("./users/pages/product", {
        products: products,
        relatedProducts: relatedProducts,
        category: category,
        collection: collection,
        selectedCategory: req.query.category,
        selectedCollection: req.query.collection,
        salePrice: salePrice,
        initialVariant: initialVariant,
        highlightedIndex: 0,
      });
    }

    console.log("products", products);
  } catch (error) {
    console.error(error);
    // res
    //   .status(500)
    //   .render("./shop/pages/404", { error: "Internal Server Error" });
  }
};

const getVariantDetails = async (req, res) => {
  try {
    const { id } = req.params;
  
    const findVariant = await variant.findById(id);
    console.log(findVariant)
    if (findVariant) {
      return res.status(200).json({ message: "successful",data:findVariant });
    }
    res.json("Id is not valid");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getLogout,
  getUserRoute,
  getproductpage,
  getShoppingpage,
  getVariantDetails,
};
