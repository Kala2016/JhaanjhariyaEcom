const userCollection = require("../../models/userSchema");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const transporter = require("../../config/emailSender");
const { forgetPassMail } = require("../../utility/forgetPassMail");

require("dotenv").config();

// password hashing-------
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// Load Login PAge
const getLogin = (req, res) => {
  const user = req.session.user;
  if (req.session.userData) {
    res.render("/");
  } else {
    res.render("./users/pages/user-login",{loggedIn :false,user});
  }
};



const postLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log(req.body)
   
    try {
      const userData = await userCollection.findOne({ email: email })
      
      .catch((error) => {
        console.error("Error finding user", error);
        res.redirect("/login?message=An error occurred during login");
      });
    console.log("User Data", userData);

    if (userData && userData.password) {
      const passwordMatch = await bcrypt.compare(password.trim(), userData.password.trim());
      console.log("Password Match", passwordMatch);
      if (passwordMatch) {
        req.session.user = userData;

        console.log("Password Match",passwordMatch,userData._id);
        res.redirect("/");
      } else {
        console.log("Password does not Match")
        res.redirect("/login?message=Email or password is incorrect");
      }
    } else {
      console.log("User not found or password not set");
      res.redirect("/login?message=Email or password is incorrect");
    }
      
    } catch (error) {
      console.error("Error finding User",error.message);
      return res.redirect("/login?message=An error occurred during login")
      
    }
    
  } catch (error) {
    console.error(error.message);
    res.redirect("/login?message=An unexpected error occurred during login");
  }
};

const forgotPasswordpage = async (req,res)=>{

  try {

    res.render('./users/pages/forgetPassEmail' )
    
  } catch (error) {

    console.error(error)
    
  }
}



// sendEmail to reset password--
const sendResetLink = async (req, res) => {
  try {
      console.log('user', req.body.email);
      const email = req.body.email;
      const user = await userCollection.findOne({ email: email });

      if (!user) {
          req.flash('danger', `User Not found for this ${email}`)
          res.redirect("/forgetPassword");

      }

      const resetToken = await user.createResetPasswordToken();
      await user.save();

      const resetUrl = `${req.protocol}://${req.get("host")}/resetPassword/${resetToken}`;
      console.log('resetUrl', resetUrl);

      try {
          forgetPassMail(email, resetUrl, user.fname);
          req.flash('info', `Reset Link sent to this ${email}`)
          res.redirect("/forgetPassword");

      } catch (error) {
          user.passwordResetToken = undefined;
          user.passwordResetTokenExpires = undefined;
          console.error(error);
          console.log("There was an error sending the password reset email, please try again later");

          req.flash('Warning', 'Error in sending Email')
          return res.redirect("/forgetPassword");
      }

  } catch (error) {
      console.error(error)
  }
}


// Resetting the password-- POST
const resetPassPage = async (req, res) => {
  try {

      const token = crypto.createHash("sha256").update(req.params.token).digest("hex");
      const user = await userCollection.findOne({ passwordResetToken: token, passwordResetTokenExpires: { $gt: Date.now() } });

      if (!user) {
          req.flash('warning', 'Token expired or Invalid')
          res.redirect("./users/pages/forgetPassEmail");
      }

      res.render("./users/pages/resetPassword",{token}) ;

  } catch (error) {
      console.error(error)
  }
}


// Resetting the password-- POST
const resetPassword = async (req, res) => { 

  const token = req.params.token;
  console.log('token',token)
  try {
      const user = await userCollection.findOne({ passwordResetToken: token, passwordResetTokenExpires: { $gt: Date.now() } });

      if (!user) {

          req.flash('warning', 'Token expired or Invalid')
          res.redirect("/forgetPassword");
      }
      // Update password
    const newPassword = req.body.password;
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

        
      

      user.password = hashedPassword;
      user.passwordResetToken = null;
      user.passwordResetTokenExpires = null;
      user.passwordChangedAt = Date.now();

      await user.save();

      console.log('password change', user.password)
      req.flash("success", "Password changed");
      res.redirect("/login");

  } catch (error) {
      console.error(error)
  }
}












module.exports = {
  postLogin,
  getLogin,
  securePassword,
  forgotPasswordpage,
  sendResetLink,
  resetPassPage,
  resetPassword,
  

  



};


