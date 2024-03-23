const Images = require("../../models/ImageSchema");
const CategoryCollection = require("../../models/categorySchema");
const productCollection = require("../../models/ProductSchema");
const CollectionModel = require("../../models/collectionSchema");
const Variant = require("../../models/variantSchema");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const express = require("express");
const adminRoute = express.Router();
const { ObjectId } = require("mongodb");
const { log } = require("console");

//Product Management
const productManagement = async (req, res) => {
  try {
    const findProduct = await productCollection
      .find()
      .populate("categoryName")
      .populate("collectionName")
      .populate("images")
      .populate("variants")


    res.render("./admin/pages/Products", {
      title: "Products",
      productList: findProduct,
    }); 
  } catch (error) {
    console.log(error);
  }
};

const getaProduct = async (req, res) => {
  try {
    //pagination
    let perPage = 12;
    let page = req.query.page || 1;
    const products = await productCollection
      .aggregate([{ $sort: { createdAt: -1 } }])
      .skip(perPage * page - perPage)
      .limit(perPage)
      .exec();

    const count = await productCollection.count();
    const pages = Math.ceil(count / perPage);

    const path = req.route.path;
    res.status(200);
    res.render("/admin/shop", {
      products,
      current: page,
      pages,
      path,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

//Render addProduct Page
const addProduct = async (req, res) => {
  try {
    const category = await CategoryCollection.find({ isListed: true });
    const collections = await CollectionModel.find();

    if (category && collections) {
      res.render("admin/pages/addProducts", {
        title: "addProducts",
        catList: category,
        collList: collections,
      });
    }
  } catch (error) {
    console.error(error);
  }
};

//Inserting a product
const insertProduct = async (req, res) => {
  try {
    console.log(req.body);
    const imageUrls = [];

    // Check if req.files exists and has images
    if (req.files && req.files.images.length > 0) {
      const images = req.files.images;

      for (const file of images) {
        try {
          const imageBuffer = await sharp(file.path)
            .resize(600, 800)
            .extract({ left: 0, top: 0, width: 300, height: 300 }) // Crop the image
            .toBuffer();
          const thumbnailBuffer = await sharp(file.path)
            .resize(300, 300)
            .toBuffer();
          const imageUrl = path.join("/adminassets/uploads", file.filename);
          const thumbnailUrl = path.join("/adminassets/uploads", file.filename);
          imageUrls.push({ imageUrl, thumbnailUrl });
        } catch (error) {
          console.error("Error processing image:", error);
        }
      }
      const variantArray = [];
      for (let i = 1; i <= req.body.variant; i++) {
        variantArray.push({
          color: req.body["color" + i],
          stock: req.body["stock" + i],
          price: req.body["price" + i],
        });
      }
      console.log("imageUrls", imageUrls);
      let imageId;
      if (imageUrls.length > 0){
      const image = await Images.create(imageUrls);
      const imageId = image.map((image) => image._id).reverse()};


      const newProduct = await productCollection.create({
        productName: req.body.productName,
        collectionName: req.body.collectionName,
        description: req.body.description,
        categoryName: req.body.categoryName,
        salePrice: req.body.salePrice,
        images: imageId,
      });
      const productData = await newProduct.save();
      let variantsId = [];
      let i = 1;

      const addVariant = async (variant, i) => {
        const variantAdd = new Variant({
          product_id: productData._id,
          v_name: `V${i++}`,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
        });

        const variantsaved = await variantAdd.save();
        variantsId.push(variantsaved._id);
      };

      const addVariants = async () => {
        for (const variant of variantArray) {
          await addVariant(variant, i);
        }

        productData.variants = variantsId;
        await productData.save();
      };

      addVariants();

      console.log("inserted", newProduct);
      // res.redirect("/admin/products?success=true");

      // res.status(201).json({ newProduct, variant: Object.keys(variantArray) });
      if (newProduct) {
        res.redirect("/admin/Products");
      }
    } else {
      res.status(400).json({ error: "Invalid input: No images provided" });
    }
  } catch (error) {
    console.error(error.message);
  }
};




const addVariant = async (req, res) => {
  try {
    const product = new ObjectId(req.session.productId);
    const LV = await Variant.aggregate([
      { $match: { product_id: product } },
      { $project: { v_name: 1, _id: 0 } },
    ]);
    const vArray = LV.map((el) => parseInt(el.v_name.slice(1)));
    const largest = Math.max(...vArray);

    const newVariant = new Variant({
      product_id: product,
      v_name: `V${largest + 1}`,
      color: req.body.newcolor,
      stock: req.body.newstock,
      price: req.body.newprice,
    });
    console.log("product price: ", price);

    const added = await newVariant.save();

    const prdAdded = await productCollection.findOneAndUpdate(
      { _id: product },
      { $push: { variants: added._id } },
      { new: true }
    );
    if (added && prdAdded) {
      res
        .status(200)
        .json({ message: "Variant added successfully", success: true });
    } else {
      res.status(400).json();
    }
  } catch (error) {
    res.status(500).json("Internal server error");
    console.log(error.message);
  }
};

const updateVariants = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const changedVariants = JSON.parse(req.body.changedVariants);
    const product = await productCollection.findById(req.session.productId);
    const promiseArray = [];

    for (const variant of changedVariants) {
      let color ="color" + variant,
        stock = "stock" + variant,
        price = "price" + variant; 

      const currentVariant = await Variant.findOne({
        product_id: product._id,
        v_name: variant,
      });
      let stockValue = currentVariant.stock + Number(req.body[stock]);
      stockValue < 0
        ? (stockValue = -currentVariant.stock)
        : (stockValue = req.body[stock]);

      const changed = await Variant.findOneAndUpdate(
        { product_id: product._id, v_name: variant },
        {
          $set: {
            color: req.body[color],
            price: req.body[price],
          },
          $inc: { stock: stockValue || 0 },
        },
        { new: true }
      );
      promiseArray.push(changed);
    }

    const allChanged = await Promise.all(promiseArray);

    if (allChanged) {
      session.commitTransaction();
      res
        .status(200)
        .json({ message: "All updates were successful", success: true });
      console.log("update successfull");
    } else {
      session.abortTransaction();
      res
        .status(400)
        .json({ message: "updation failed, retry!", success: false });
    }
  } catch (error) {
    console.log(error.message);
    session.abortTransaction();
    res.status(500).send("Internal server error!");
  } finally {
    session.endSession();
  }
};

// ListProduct
const listProduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);

    const listing = await productCollection.findByIdAndUpdate(
      { _id: id },
      { $set: { isListed: true } }
    );
    console.log(listing);
    res.redirect("/admin/Products");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// unlist Product
const unListProduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);

    const listing = await productCollection.findByIdAndUpdate(
      { _id: id },
      { $set: { isListed: false } }
    );
    console.log(listing);
    res.redirect("/admin/Products");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
};

// editProductPage
const editProductPage = async (req, res) => {
  try {
    const id = req.params.id;
    const category = await CategoryCollection.find({ isListed: true });
    const collections = await CollectionModel.find({});
    const productFound = await productCollection
      .findById(id)
      .populate("categoryName")
      .populate("images")
      .populate("collectionName")
      .populate("variants")

    console.log("images", productFound.images);
    console.log(productFound);
    if (productFound) {
      res.render("admin/pages/editProduct", {
        title: "editProduct",
        product: productFound,
        catList: category,
        collList: collections,
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};


const updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('id  body', req.body);
    const updateProduct = await productCollection.findByIdAndUpdate(
      { _id: id },
      req.body
    );
    if (!updateProduct) {
      return res.status(404).send("Product not found");
    }

    res.redirect("/admin/Products");
  } catch (error) {
    console.error(error.message);
    if (!updateProduct) {
      return res.status(404).send("Product not found");
    }
  }
};

// edit image function
const editImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    const file = req.file;
    console.log("file", req.file);
    const imageBuffer = await sharp(file.path).resize(600, 800).toBuffer();
    const thumbnailBuffer = await sharp(file.path).resize(300, 300).toBuffer();
    const imageUrl = path.join("/adminassets/uploads", file.filename);
    const thumbnailUrl = path.join("/adminassets/uploads", file.filename);
    const product = await productCollection.findById({_id :id});

    const images = await Images.findByIdAndUpdate(imageId, {
      imageUrl: imageUrl,
      thumbnailUrl: thumbnailUrl,

    }, { new: true }); //return the updated document

    req.flash("success", "Image updated");
    res.redirect("back");
  } catch (error) {
    console.error(error.message);
  }
};

// Delete image using fetch
// const deleteImage = async (req, res) => {
//   try {
//     const imageId = req.params.id;
//     // Optionally, can remove the image from your database
//     await Images.deleteOne({ _id: imageId });
//     const product = await productCollection.findOneAndUpdate(
//       { images: imageId },
//       { $pull: { images: imageId } },
//       { new: true }
//     );
//     res.json({ message: "Images Removed" });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const deleteImage = async (req, res) => {
  try {
    const imageId = req.params.id;
    // Optionally, can remove the image from your database
    // Assuming Images is a model or collection from MongoDB
    await Images.deleteOne({ _id: imageId });
    const product = await productCollection.findOneAndUpdate(
      { images: imageId },
      { $pull: { images: imageId } },
      { new: true }
    );
    // Sending a confirmation message to the client
    res.json({ message: "Image about to be deleted. Confirm?", imageId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const getallProduct = async (req, res) => {
  try {
    // Filtering
    const queryObj = { ...req.query };
    const excludeFields = ["page", "sort", "limit", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = productCollection.find(JSON.parse(queryStr));

    //Sorting

    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    //Limiting the feilds

    if (req.query.feilds) {
      const fields = req.query.feilds.split(",").join(" ");
      query = query.select(fields);
    } else {
      query = query.select("__v");
    }
    // //pagination

    // const page = req.query.page;
    // const limit = req.query.limit;
    // const skip = (page - 1)* limit;
    // if (req.query.page) {
    //   const  productCount =await productCollection.countDocuments();
    //   if(skip >= productCount) throw new Error("This page doest not exists")

    // }

    const product = await query;

    res.json(product);
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  addProduct,
  insertProduct,
  listProduct,
  unListProduct,
  editProductPage,
  updateProduct,
  editImage,
  deleteImage,
  productManagement,
  getaProduct,
  getallProduct,
  addVariant,
  updateVariants,
  
};
