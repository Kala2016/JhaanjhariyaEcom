const express = require("express");
const userRoute = express.Router();
const logger = require("morgan");
const session = require("express-session");
const cookieparser = require("cookie-parser");
const app = express();
const path = require("path");
const { userLoggedIn, userNotLoggedIn,userValid } = require('../middlewares/userAuth')
const { validateID } = require('../middlewares/idValidation')
const multer = require('multer')


const homeController = require("../controller/userControllers/homeCtrl");
const cartController = require("../controller/userControllers/cartCtrl")
const loginController = require("../controller/userControllers/loginCtrl");
const signupController = require("../controller/userControllers/signupCtrl");
const profileController = require("../controller/userControllers/profileCtrl");
const addressController = require("../controller/userControllers/addressCtrl");

// Middleware to set views folder for admin
userRoute.use((req, res, next) => {
    app.set('views',path.join(__dirname, "views"));
    next();
  });


  const storage = multer.memoryStorage();
  const upload = multer({storage:storage});
  
  const imageStorage = multer.diskStorage({
      destination:function(req,file,cb){
          const folder = path.join(__dirname,`../public/users`)
          if(!fs.existsSync(folder)){
              fs.mkdirSync(folder);
              console.log("path created!")
          }
  
          cb(null,folder)
      },
      filename:function(req,file,cb){
          const name = req.session.user+path.extname(file.originalname);
          console.log(name);
          cb(null,name);
      }
  })
  
  const imageUpload = multer({storage:imageStorage})




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
userRoute.post("/addtocart",userValid,userLoggedIn,cartController.addtoCart)
userRoute.post('/updateCartItem/:id',userValid,userLoggedIn,cartController.updateCart)
userRoute.get('/checkProductAvailability', userLoggedIn, cartController.checkProductAvailability);
userRoute.get('/removeProduct/:id',userValid,userLoggedIn,cartController.removeProductfromCart)






// userRoute.put("/productaddtocart",userValid,userLoggedIn,cartController.productAddtoCart);

// forget-Password and reset password section 
userRoute.get('/forgetPassword', loginController.forgotPasswordpage);
userRoute.post('/forgetPassword', loginController.sendResetLink);
userRoute.get('/resetPassword/:token', loginController.resetPassPage);
userRoute.post('/resetPassword/:token',loginController.resetPassword);

//userProfile

userRoute.get('/userProfile',profileController.getUserProfilePage);
userRoute.post('/editProfile',profileController.geteditProfile);
userRoute.put('/editProfile',profileController.editProfile)
userRoute.post('/uploadDp',imageUpload.single("image"),profileController.uploadDp)


//addAddress
userRoute.get("/savedAddress",addressController.savedAddress)
userRoute.get('/addAddress', addressController.addAddressPage)
userRoute.get('/')




userRoute.get('*', (req, res) => { res.render('users/pages/404') })



module.exports = userRoute;
