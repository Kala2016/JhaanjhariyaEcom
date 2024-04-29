const express = require("express");
const adminRoute = express.Router();
const session = require("express-session");
const { isAdminLoggedIn, isAdminLoggedOut } = require('../middlewares/adminAuth')
const { adminValidateID} = require('../middlewares/idValidation')
const { upload } = require('../config/upload')
const categoryCtrl = require("../controller/adminControllers/categoryCtrl");
const productCtrl = require("../controller/adminControllers/productCtrl");
const adminCtrl = require("../controller/adminControllers/adminCtrl");
const userCtrl = require("../controller/adminControllers/userCtrl");
const collectionCtrl = require("../controller/adminControllers/collectionCtrl");
const orderCtrl =require("../controller/adminControllers/orderCtrl");
const couponCtrl =require("../controller/adminControllers/couponCtrl")
const bannerCtrl = require("../controller/adminControllers/bannerCtrl")



// const variantCtrl = require("../controller/adminControllers/variantCtrl")


const dotenv = require("dotenv").config();


//settings
// adminRoute.set('view engine', 'ejs');
// adminRoute.set('views','.views/admin');

//Admin Login
adminRoute.get('/', isAdminLoggedOut, adminCtrl.loadLogin)
adminRoute.post('/', adminCtrl.verifyAdmin);
adminRoute.get('/admin', isAdminLoggedIn, adminCtrl.logout)
adminRoute.get('/dashboard', isAdminLoggedIn, adminCtrl.loadDashboard)
adminRoute.get('/adminProfile',adminCtrl.adminProfile)
adminRoute.get('/dashboard/sales-report', isAdminLoggedIn, adminCtrl.salesReportPage)
adminRoute.post('/dashboard/sales-report', isAdminLoggedIn, adminCtrl.generateSalesReport)



    


//Product Management
adminRoute.get("/Products",productCtrl.productManagement)
adminRoute.get("/Products",productCtrl.addProduct)
adminRoute.get("/addProducts",productCtrl.addProduct)
adminRoute.post('/addProducts',
        upload.fields([{ name: "images" }]),
        productCtrl.insertProduct) /** Product adding and multer using  **/
adminRoute.post('/list/:id', productCtrl.listProduct)
adminRoute.post('/unList/:id',productCtrl.unListProduct)  
adminRoute.get('/editProduct/:id',productCtrl.editProductPage)
adminRoute.post('/editProduct/:id',productCtrl.updateProduct)
adminRoute.put('/editimage/productId/image/:imageId', upload.single("image"),
    productCtrl.editImage)
adminRoute.put('/updateProduct/:id',productCtrl.updateProduct)   
adminRoute.delete('/delete-image/:id', productCtrl.deleteImage),
adminRoute.post('/searchProduct',productCtrl.getaProduct)
adminRoute.post('/')



        
//Category Management       

adminRoute.get("/addCategory", categoryCtrl.getCategory);
adminRoute.post("/addCategory",categoryCtrl.insertCategory) 
adminRoute.get('/list/:id',categoryCtrl.list)
adminRoute.get('/unList/:id',categoryCtrl.unList)
adminRoute.get('/editCategory/:id', categoryCtrl.editCategory)
adminRoute.post('/editCategory/:id', categoryCtrl.updateCategory)
adminRoute.post('/category/search', categoryCtrl.searchCategory)

//Collections Management
adminRoute.get("/addCollections", collectionCtrl.getCollections);
adminRoute.post("/addCollections", collectionCtrl.postCollection);
adminRoute.get('/editCollection/:id', collectionCtrl.editCollection)
adminRoute.post('/editCollection/:id',collectionCtrl.updateCollection)

//Variant 
adminRoute.get("/addVariant", productCtrl.addVariant);
adminRoute.post("/addVariant", productCtrl.addVariant)

//User Management
adminRoute.get("/userList",isAdminLoggedIn,userCtrl.getUser);
adminRoute.post('/user/search',isAdminLoggedIn,userCtrl.searchUser)
adminRoute.post('/user/blockUser/:id',isAdminLoggedIn,userCtrl.blockUser)

//Order Management

adminRoute.get("/orders",isAdminLoggedIn,orderCtrl.ordersPage);
adminRoute.get('/editOrder/:id', isAdminLoggedIn,orderCtrl.editOrderPage)
adminRoute.post('/editOrder/:id', isAdminLoggedIn, orderCtrl.updateOrder)

//Coupon Management
adminRoute.get("/coupons",isAdminLoggedIn,couponCtrl.listCoupons)
adminRoute.get("/coupon/add-coupon",isAdminLoggedIn, couponCtrl.addCouponPage)
adminRoute.post("/coupon/add-coupon",isAdminLoggedIn, couponCtrl.createCoupon)
adminRoute.get("/coupons/edit-coupon/:id",isAdminLoggedIn, couponCtrl.editCouponPage)
adminRoute.post("/coupons/edit-coupon/:id", isAdminLoggedIn,couponCtrl.editCoupon)


// Banner management --
adminRoute.get('/banners', isAdminLoggedIn, bannerCtrl.listBanners)
adminRoute.get('/banner/add-banner', isAdminLoggedIn, bannerCtrl.addBannerPage)
adminRoute.post('/banner/add-banner', upload.single("bannerImage"), isAdminLoggedIn, bannerCtrl.createBanner)
adminRoute.post('/banner/updateBannerStatus/:id', adminValidateID, isAdminLoggedIn, bannerCtrl.updateBannerStatus)


module.exports = adminRoute;
                                        