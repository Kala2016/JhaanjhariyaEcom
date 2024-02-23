const userCollection = require("../../models/userSchema");
const bcrypt = require("bcrypt");

const transporter = require("../../config/emailSender");

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
   
    try {
      const userData = await userCollection.findOne({ email: email })
      
      .catch((error) => {
        console.error("Error finding user", error);
        res.redirect("/login?message=An error occurred during login");
      });
    console.log("User Data", userData);

    if (userData && userData.password) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
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

module.exports = {
  postLogin,
  getLogin,
  securePassword,
};


