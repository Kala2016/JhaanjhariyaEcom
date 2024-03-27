const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const CategoryCollection = require("../../models/categorySchema");
const CollectionModel = require("../../models/collectionSchema");
// const Cart = require("../../models/cartSchema");
const { ObjectId } = require("mongodb");
const variant= require("../../models/variantSchema");
const express = require('express')
const router = express.Router();

//Search 

// Define the search route


const searchRouter = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: 'Please provide a search query' });
    }
    // Perform the search query on the productCollection
    const results = await productCollection.find({ $text: { $search: query } });
    if (results.length === 0) {
      return res.status(404).json({ message: 'No products found matching your search' });
    }
    res.render("./users/pages/product", {
      products: results,      

     });

    
  } catch (error) {
    console.error('Error in searching:', error);
    return res.status(500).json({ message: 'Server Error!' });
  }
};







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
    // Fetch category and collection data from the database
    const category = await CategoryCollection.find();
    const collection = await CollectionModel.find();

    // Extract other query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || null;
    const categoryFilter = req.query.category || null;
    const collectionFilter = req.query.collection || null;
    const searchQuery = req.query.query || null;

    // Prepare filter criteria
    const filter = { isListed: true };

    if (categoryFilter) {
      const catId = CategoryCollection.find(cat => cat.categoryName === categoryFilter)?._id;
      if (catId) {
        filter.categoryName = catId;
      }
    }

    if (collectionFilter) {
      const collId = CollectionModel.find(coll => coll.collectionName === collectionFilter)?._id;
      if (collId) {
        filter.collectionName = collId;
      }
    }

    // If search query is provided, add it to the filter criteria
    if (searchQuery) {
      filter.productName = { $regex: new RegExp(searchQuery, 'i') };
    }

    // Prepare sorting criteria
    let sortCriteria = {};
    if (sort === 'lowToHigh') {
      sortCriteria.salePrice = 1;
    } else if (sort === 'highToLow') {
      sortCriteria.salePrice = -1;
    }

    // Find products based on filter criteria, pagination, and sorting
    const products = await productCollection
      .find(filter)
      .populate("productName")
      .populate("images")
      .populate("categoryName")
      .populate("collectionName")
      .populate("variants")
      .populate("salePrice")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortCriteria);

    // Render the page with the filtered, paginated, and sorted products
    res.render("./users/pages/shop", {
      products: products,      
      category: category,
      collection: collection,
      selectedCategory: categoryFilter,
      selectedCollection: collectionFilter,
      salePrice: 0, // Consider if you need to adjust this value
      currentPage: page,
      totalPages: Math.ceil(products.length / limit) || 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
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
        category: category,
        collection: collection,
        relatedProducts:relatedProducts,     
        selectedCategory: req.query.category,
        selectedCollection: req.query.collection,
        salePrice: salePrice,
        initialVariant: initialVariant,
        highlightedIndex: 0,
      });
    }
    console.log("category===",category)
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
  searchRouter
};
