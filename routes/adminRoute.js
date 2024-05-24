const express = require("express");
const adminRoute = express.Router();
const session = require("express-session");
const {
  isAdminLoggedIn,
  isAdminLoggedOut,
} = require("../middlewares/adminAuth");
const { adminValidateID } = require("../middlewares/idValidation");
const { upload } = require("../config/upload");
const categoryCtrl = require("../controller/adminControllers/categoryCtrl");
const productCtrl = require("../controller/adminControllers/productCtrl");
const adminCtrl = require("../controller/adminControllers/adminCtrl");
const userCtrl = require("../controller/adminControllers/userCtrl");
const collectionCtrl = require("../controller/adminControllers/collectionCtrl");
const orderCtrl = require("../controller/adminControllers/orderCtrl");
const couponCtrl = require("../controller/adminControllers/couponCtrl");
const bannerCtrl = require("../controller/adminControllers/bannerCtrl");

// const variantCtrl = require("../controller/adminControllers/variantCtrl")

const dotenv = require("dotenv").config();

//settings
// adminRoute.set('view engine', 'ejs');
// adminRoute.set('views','.views/admin');

//Admin Login
adminRoute.get("/", isAdminLoggedOut, adminCtrl.loadLogin);
adminRoute.post("/", adminCtrl.verifyAdmin);
adminRoute.get("/admin", isAdminLoggedIn, adminCtrl.logout);
adminRoute.get("/dashboard", isAdminLoggedIn, adminCtrl.loadDashboard);
adminRoute.get("/adminProfile", adminCtrl.adminProfile);

//Reports
adminRoute.get(
  "/dashboard/sales-report",
  isAdminLoggedIn,
  adminCtrl.salesReportPage
);
// adminRoute.post(
//   "/dashboard/sales-report",
//   isAdminLoggedIn,
//   adminCtrl.generateSalesReport
// );

adminRoute.get('/salesDaily',isAdminLoggedIn,adminCtrl.dailySaleReport)
adminRoute.get('/salesWeekly',isAdminLoggedIn,adminCtrl.weeklySalesReport)
adminRoute.get('/salesMonthly',isAdminLoggedIn,adminCtrl.monthlySalesReport)
adminRoute.get('/salesYearly',isAdminLoggedIn,adminCtrl.YearlySalesReport)
adminRoute.post('/customDate',isAdminLoggedIn,adminCtrl.customDateSort)
adminRoute.get('/yearlyChart',isAdminLoggedIn,adminCtrl.yearlyChart)
adminRoute.get('/getTopSellingData',isAdminLoggedIn,adminCtrl.getTopSellingData)

//Product Management
adminRoute.get("/Products", productCtrl.productManagement);
adminRoute.get("/addProducts", isAdminLoggedIn,productCtrl.addProduct);
adminRoute.post("/addProducts",upload.fields([{ name: "images" }]),productCtrl.insertProduct); 

// Product Listing and Unlisting Routes
adminRoute.post("/list/:id",isAdminLoggedIn, productCtrl.listProduct);
adminRoute.post("/unList/:id",isAdminLoggedIn, productCtrl.unListProduct);

// Product Editing Routes
adminRoute.get("/editProduct/:id",isAdminLoggedIn, productCtrl.editProductPage);
adminRoute.post("/editProduct/:id",isAdminLoggedIn, productCtrl.updateProduct);
adminRoute.post('/editProduct/:id', isAdminLoggedIn, upload.array('images'), productCtrl.updateProduct);
adminRoute.post("/updateProduct/:id",isAdminLoggedIn, productCtrl.updateProduct);

//Additional Routes
adminRoute.delete("/delete-image/:id", isAdminLoggedIn,productCtrl.deleteImage),
adminRoute.post("/searchProduct", isAdminLoggedIn,productCtrl.getaProduct);


//Category Management
adminRoute.get("/addCategory", isAdminLoggedIn,categoryCtrl.getCategory);
adminRoute.post("/addCategory", isAdminLoggedIn,categoryCtrl.insertCategory);
adminRoute.get("/list/:id", isAdminLoggedIn,categoryCtrl.list);
adminRoute.get("/unList/:id", isAdminLoggedIn,categoryCtrl.unList);
adminRoute.get("/editCategory/:id", isAdminLoggedIn,categoryCtrl.editCategory);
adminRoute.post("/editCategory/:id", isAdminLoggedIn,categoryCtrl.updateCategory);
adminRoute.post("/category/search", isAdminLoggedIn,categoryCtrl.searchCategory);

//Collections Management
adminRoute.get("/addCollections",isAdminLoggedIn,collectionCtrl.getCollections);
adminRoute.post("/addCollections",isAdminLoggedIn, collectionCtrl.postCollection);
adminRoute.get("/editCollection/:id",isAdminLoggedIn, collectionCtrl.editCollection);
adminRoute.post("/editCollection/:id",isAdminLoggedIn, collectionCtrl.updateCollection);

//Variant
adminRoute.get("/addVariant", isAdminLoggedIn,productCtrl.addVariant);
adminRoute.post("/addVariant", isAdminLoggedIn,productCtrl.addVariant);

//User Management
adminRoute.get("/userList", isAdminLoggedIn, userCtrl.getUser);
adminRoute.post("/user/search", isAdminLoggedIn, userCtrl.searchUser);
adminRoute.post("/user/blockUser/:id", isAdminLoggedIn, userCtrl.blockUser);

//Order Management

adminRoute.get("/orders", isAdminLoggedIn, orderCtrl.ordersPage);
adminRoute.get("/editOrder/:id", isAdminLoggedIn, orderCtrl.editOrderPage);
adminRoute.post("/editOrder/:id", isAdminLoggedIn, orderCtrl.updateOrder);

//Coupon Management
adminRoute.get("/coupons", isAdminLoggedIn, couponCtrl.listCoupons);
adminRoute.get("/coupon/add-coupon", isAdminLoggedIn, couponCtrl.addCouponPage);
adminRoute.post("/coupon/add-coupon", isAdminLoggedIn, couponCtrl.createCoupon);
adminRoute.get(
  "/coupons/edit-coupon/:id",
  isAdminLoggedIn,
  couponCtrl.editCouponPage
);
adminRoute.post(
  "/coupons/edit-coupon/:id",
  isAdminLoggedIn,
  couponCtrl.editCoupon
);

// Banner management --
adminRoute.get("/banners", isAdminLoggedIn, bannerCtrl.listBanners);
adminRoute.get("/banner/add-banner", isAdminLoggedIn, bannerCtrl.addBannerPage);
adminRoute.post(
  "/banner/add-banner",
  upload.single("bannerImage"),
  isAdminLoggedIn,
  bannerCtrl.createBanner
);
adminRoute.post(
  "/banner/updateBannerStatus/:id",
  adminValidateID,
  isAdminLoggedIn,
  bannerCtrl.updateBannerStatus
);

module.exports = adminRoute;
