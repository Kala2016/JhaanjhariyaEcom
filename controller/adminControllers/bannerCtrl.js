const path = require("path");
const fs = require("fs");

const productCollection = require("../../models/ProductSchema");
const Banner = require("../../models/bannerSchema");
const { log } = require("console");

// list banners--
// list banners--
const listBanners = async (req, res) => {
  try {
    const listBanners = await Banner.find();
    // Construct full image URLs
    listBanners.forEach(banner => {
      // Constructing image URL using path.join is causing incorrect URLs.
      // Use string concatenation instead.
      banner.bannerImage = `http://localhost:3000${banner.bannerImage.replace(/\\/g, '/')}`;
    });
    res.render("./admin/pages/banners", {
      title: "Banner",
      banners: listBanners,
    });
  } catch (error) {
    console.error(error);
  }
};



const addBannerPage = async (req, res) => {
  try {
    const findProducts = await productCollection.find({ isListed: true });
    res.render("./admin/pages/addBanner", {
      title: "Add Banner",
      Products: findProducts,
    });
  } catch (error) {
    console.error(error);
  }
};

const createBanner = async (req, res) => {
  try {
    let bannerImage;
    req.file &&
      (bannerImage = path.join("/adminassets/uploads", req.file.filename));
    const newBanner = {
      bannerImage: bannerImage,
      productUrl: req.body.productUrl,
      title: req.body.title,
      description: req.body.description,
    };

    const create = await Banner.create(newBanner)
    res.redirect("/admin/banners");
  } catch (error) {
    console.error(error);
  }
};

const updateBannerStatus = async (req, res) => {
  try {
    const bannerId = req.params.id;
    const status = req.body.isActive;
    const findBanner = await Banner.findByIdAndUpdate(bannerId, {
      isActive: status,
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  addBannerPage,
  createBanner,
  listBanners,
  updateBannerStatus,
};