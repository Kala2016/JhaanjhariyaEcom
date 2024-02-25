const express = require("express");
const userRoute = express.Router();
const logger = require("morgan");
const session = require("express-session");
const cookieparser = require("cookie-parser");
const app = express();
const path = require("path");
const { userLoggedIn, userNotLoggedIn,userValid } = require('../middlewares/userAuth')
const { validateID } = require('../middlewares/idValidation')



const homeController = require("../controller/userControllers/homeCtrl");
const cartController = require("../controller/userControllers/cartCtrl")
const loginController = require("../controller/userControllers/loginCtrl");
const signupController = require("../controller/userControllers/signupCtrl");
const profileController = require("../controller/userControllers/profileCtrl");

// Middleware to set views folder for admin
userRoute.use((req, res, next) => {
    app.set('views',path.join(__dirname, "views"));
    next();
  });


//Routes Home Page
userRoute.get('/', homeController.getUserRoute);
userRoute.get('/logout', userLoggedIn,homeController.getLogout);

//Routes Login Page
userRoute.get('/login', userNotLoggedIn,loginController.getLogin);
userRoute.post('/postLogin',loginController.postLogin)

  
//Routes Signup Page
userRoute.get("/user-signup",signupController.getUserSignup); 
userRoute.post("/user-signup",signupController.postUserSignup);
userRoute.get('/sendOtp',signupController.sendOTPpage);
userRoute.post('/sendOtp',signupController.verifyOTP);
userRoute.get('/otpVerify',signupController.loadOtp);
userRoute.post('/verify-otp',signupController.verifyOTP);
userRoute.get('/sendOtpAgain',signupController.sendOtpAgain);
userRoute.get('/reSendOtp',signupController.reSendOTP);
userRoute.post('/reSendOtp',signupController.verifyResendOTP)


// product /shop page 
// userRoute.get('/product',homeController.getproductpage)
userRoute.get('/product/:id',homeController.getproductpage)
userRoute.get('/shop',homeController.getShoppingpage)
userRoute.get("/product/variants/:id",homeController.getVariantDetails)

// shopping-cart
userRoute.get('/shopping-cart',userValid,userLoggedIn,cartController.getCartPage)
userRoute.post('/shopping-cart',userValid,userLoggedIn,cartController.addtoCart)
userRoute.post("/addtocart",userValid,userLoggedIn,cartController.addtoCart);

// userRoute.put("/productaddtocart",userValid,userLoggedIn,cartController.productAddtoCart);




userRoute.get('/userProfile',profileController.getUserProfilePage)






module.exports = userRoute;
