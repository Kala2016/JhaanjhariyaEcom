const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const CategoryCollection = require("../../models/categorySchema");
const CollectionModel = require("../../models/collectionSchema");
const Banner = require("../../models/bannerSchema");
const { ObjectId } = require("mongodb");
const variant = require("../../models/variantSchema");
const express = require("express");
const router = express.Router();

//Search

// Define the search route

const searchRouter = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ message: "Please provide a search query" });
    }
    // Perform the search query on the productCollection
    const results = await productCollection.find({ $text: { $search: query } });
    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found matching your search" });
    }
    res.render("./users/pages/product", {
      products: results,
    });
  } catch (error) {
    console.error("Error in searching:", error);
    return res.status(500).json({ message: "Server Error!" });
  }
};

// Load Home Page
const getUserRoute = async (req, res) => {
  try {
    const user = req.session.user;
    const loggedIn = req.session.loggedIn;
    const category = await CategoryCollection.find();
    const banners = await Banner.find({ isActive: true });
    // Assuming 'banners' is an array of banner objects
    const listBanners = banners.map((banner) => ({
      ...banner,
      imgUrl: banner.bannerImage.replace(/\\/g, "/"),
    }));

    console.log("list bzannerrrr", listBanners);
    const cart = await userCollection.find();
    const products = await productCollection
      .find()
      .populate("productName")
      .populate("images")
      .populate("variants")
      .populate("categoryName")
      .populate("collectionName");

    res.render("./users/pages/home", {
      products: products,
      cart: cart,
      banners: listBanners,
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
    const limit = parseInt(req.query.limit) || 9;
    const sort = req.query.sort || null;
    const categoryFilter = req.query.category || null;
    const collectionFilter = req.query.collection || null;
    const searchQuery = req.query.query || null;
    // Prepare filter criteria
    const filter = { isListed: true };

    if (categoryFilter) {
      const cat = await CategoryCollection.findOne({categoryName: categoryFilter});
      if (cat) {
        filter.categoryName = cat._id;
      }
    }

    if (collectionFilter) {
      const coll = await CollectionModel.findOne({collectionName : collectionFilter})
      if (coll) {
        filter.collectionName = coll._id
      }
    } 

    // Check if a search query is provided
    if (req.query.search) {
      filter.$or = [
          { productName: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex:   req.query.search, $options: 'i' } },
      ];
  }

    let sortCriteria = {};

    // Check for price sorting
    if (req.query.sort === 'lowtoHigh') {
        sortCriteria.salePrice = 1;
    } else if (req.query.sort === 'highToLow') {
        sortCriteria.salePrice = -1;
    }
    console.log(req.query)
    


    // Now fetch the user's wishlist data
    let userWishlist;
    if (req.user) {
      const userId = req.user._id; // Assuming req.user contains user data
      userWishlist = await userCollection.findById(userId).populate({
        path: 'wishlist',
        populate: {
          path: 'images',
        },
      });
    }

    // Count the total number of matching products
    const count = await productCollection.find(filter).countDocuments();
        
    let selectedCategory = filter.categoryName ? [filter.categoryName] : [];

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

      // console.log(products);

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
      userWishlist: userWishlist?userWishlist.wishlist :[],
      selectedCategory,
      search:req.query.search ? req.query.search : ''
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
        relatedProducts: relatedProducts,
        selectedCategory: req.query.category,
        selectedCollection: req.query.collection,
        salePrice: salePrice,
        initialVariant: initialVariant,
        highlightedIndex: 0,
      });
    }
    console.log("category===", category);
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
    console.log(findVariant);
    if (findVariant) {
      return res.status(200).json({ message: "successful", data: findVariant });
    }
    res.json("Id is not valid");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const wishlist = async (req, res) => {
  try {
    const id = req.userId;
    const userWishlist = await userCollection.findById({ _id: id }).populate({
      path: "wishlist",
      populate: {
        path: "images",
      },
    });
    res.render("./users/pages/wishlist", { wishlist: userWishlist.wishlist });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const addTowishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const productId = req.params.id;

    const user = await userCollection.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.wishlist.includes(productId)) {
      return res.json({ success: false, message: 'Product already in wishlist' });
    } 

    await userCollection.findByIdAndUpdate(userId, { $push: { wishlist: productId } });
    res.json({ success: true, message: 'Product added to wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};



const removeItemfromWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const productId = req.params.id;

    const user = await userCollection.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    await userCollection.findByIdAndUpdate(userId, {
      $pull: { wishlist: productId },
    });
    res.json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const additemsfrmWishlisttoCart = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const { quantity = 1 } = req.query;
    const userID = req.session.user._id;

    const variantData = await variant.findById(variantId);
    const variantExists = await variant.exists({ _id: variantId });

    if (!variantId) {
      return res.status(400).json({ message: "Variant ID is required" });
    }

    if (!variantExists) {
      return res.status(404).json({ message: "Variant not found" });
    }

    const alreadyIn = await userCollection.findOne({
      _id: userID,
      "cart.variantId": variantId,
    });

    if (alreadyIn) {
      return res.status(409).json({ message: "Item already in Cart" });
    }

    const cartUpdated = await userCollection.findByIdAndUpdate(
      userID,
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

    if (!cartUpdated) {
      return res
        .status(400)
        .json({ message: "Couldn't update Cart", success: false });
    }

    // Clear wishlist for the user
    const updatedUser = await userCollection.findByIdAndUpdate(
      userID,
      { wishlist: [] },
      { new: true }
    );

    console.log("Wishlist cleared for user:", updatedUser);

    return res.status(200).redirect("/shopping-cart");
  } catch (error) {
    console.error("Error in Cart", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

function toggleWishlist(productId) {
  // Check if the product is already in the wishlist
  fetch(`/toggleWishlist/${productId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Update UI based on wishlist data
      updateUIWithWishlistData(data.wishlist);
    })
    .catch((error) => {
      console.error("Error toggling wishlist:", error);
    });
}

module.exports = {
  getLogout,
  getUserRoute,
  getproductpage,
  getShoppingpage,
  getVariantDetails,
  searchRouter,
  wishlist,
  removeItemfromWishlist,
  addTowishlist,
  toggleWishlist,
  additemsfrmWishlisttoCart,
};
