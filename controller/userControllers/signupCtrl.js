  const userCollection = require("../../models/userSchema");
  const dotenv = require("dotenv").config();
  const bcrypt = require("bcrypt");
  const { sendOtp, generateOTP } = require("../../utility/nodeMailer");
  const { productAddtoCart } = require("./cartCtrl");
  const productCollection = require("../../models/ProductSchema");


  //  user signup
  const getUserSignup = (req, res) => {
    res.render("users/pages/user-signup");
  };

  const loadOtp = async (req, res) => {
    res.render("users/pages/otpVerify");
  };

  const postUserSignup = async (req, res) => {
    try {
      console.log("req body====================================================", req.body);
      const emailCheck = req.body.email;
      const email = await userCollection.findOne({ email: emailCheck });
      console.log("mail", emailCheck);
      if (email) {
        res.render("users/pages/user-signup", {
          error: "Email already exists,please try with new email",
        });
      } else {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        (req.session.fname = req.body.fname),
          (req.session.lname = req.body.lname),
          (req.session.email = req.body.email),
          (req.session.mobile = req.body.mobile),
          (req.session.password = hashedPassword);
        const OTP = generateOTP();
        req.session.otpUser = OTP;
        console.log("Sending OTP to email:", req.body.email);

        try {
          await sendOtp(req.body.email, OTP, req.body.fname);
          return res.redirect("/sendOtp");
        } catch (error) {
          console.error("Error sending OTP", error);
          return res.status(500).json({success : false, message:"Error sending OTP"});
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const sendOtpAgain = async (req, res) => {
    try {
      console.log("entered the function");
      // res.redirect("/sendOtp");
      const OTP = generateOTP();
      console.log("resendOTP===" + OTP);

      const email = req.session.email;
      const fname = req.session.fname;

      console.log("email===" + email);
      console.log("fname===" + fname);

      //   req.session.otpUser={
      //   otp :{ otp: OTP },
      //   email:req.session.email,
      //   fname:req.session.fname
      // };
      // otp resending

      await sendOtp(email, OTP, fname);
      console.log("OTP is sent");
      return res.render("./users/pages/otpVerify", { message: email });
    } catch (error) {
      console.error(error);
    }
  };

  const sendOTPpage = async (req, res) => {
    try {
      const email = req.session.email;
      console.log("email", email);
      res.render("users/pages/otpVerify", { message: email });
    } catch (error) {
      console.error(error);
    }
  };

  const verifyOTP = async (req, res) => {
    try {
      const otpUser = req.session.otpUser;
      console.log("req,res", otpUser);
      if (!otpUser) {
        return res.redirect("users/pages/user-signup");
      }

      const enteredOTP = req.body.otpInput;
      const userInDB = await userCollection.findOne({
        email: otpUser.email,
      });

      if (userInDB) {
        // Handle the case where the user is not found in the database
        return res.status(400).json({ error: "User not found" });
      }

      if (enteredOTP === otpUser.otp) {
        otpUser.otp = null;
        const newUser = new userCollection({
          // Update user data in the database
          fname: req.session.fname,
          lname: req.session.lname,
          email: req.session.email,
          mobile: req.session.mobile,
          password: req.session.password,
        });

        let insertUser  = await newUser.save();
        console.log(insertUser,'insertUser')
        if(insertUser) {
          
          const user = await userCollection.findone({email:otpUser.email})
          const newCart = new productCollection.findById({user_id:user._id,products:[]})
          await newCart.save();

        } 
        

        req.session.otpUser = null;

        res.redirect("/login?message=OTP verification successful");
      } else {
        res.status(400).json({ error: "Invalid OTP, please try again" });
      }
    } catch (error) {
      console.error(error);
        res.redirect("/login?message=OTP verification successful");
        
      
    }
  };

  

  const reSendOTP = async (req, res) => {
    try {
        const OTP = generateOTP() /** otp generating **/
        req.session.otpUser.otp = { otp: OTP };

        const email = req.session.email;
        const fname = req.session.fname;


        /***** otp resending ******/
        try {
            sendOtp(email, OTP, fname);
            console.log('otp is sent');
            return res.render('/users/pages/reSendOTP', { message: email });
        } catch (error) {
            console.error('Error sending OTP:', error);
            return res.status(500).send('Error sending OTP');
        }

    } catch (error) {
        console.error(error)
    }
}

  const verifyResendOTP = async (req, res) => {
    try {
      const enteredOTP = req.body.otp;
      const storedOTP = req.session.otpUser.otp;

      if (enteredOTP === storedOTP.otp) {
        const newUser = userCollection.create(req.session.otpUser);

        if (newUser) {
          delete req.session.otpUser.otp;
          req.flash("success", "Registration success, Please login");
          return res.redirect("/login");
        } else {
          console.log("Error in inserting user");
          req.flash("error", "Error in registration, please try again");
          return res.redirect("/user-signup");
        }
      } else {
        req.flash("error", "Invalid OTP, please try again");
        return res.redirect("/user-signup");
      }
    } catch (error) {
      console.error("Error in verifyResendOTP:", error);
      req.flash("error", "Internal Server Error");
      return res.status(500).send("Internal Server Error");
    }
  };

  module.exports = {
    verifyOTP,
    verifyResendOTP,
    sendOtpAgain,
    reSendOTP,
    postUserSignup,
    getUserSignup,
    sendOTPpage,
    loadOtp,
  };