const express = require("express");
const userCollection = require("../models/userSchema");

const userLoggedIn = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await userCollection.findById(req.session.user._id);
      if (!user.is_Blocked) {
        req.userId = user._id;
        return next(); // Proceed to the next middleware
      }
      // User is blocked, so redirect to logout with an error message
      return res.redirect("/logout?blocked=true");
    } else { 
      // If user is not logged in, redirect to the login page
      return res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in userLoggedIn middleware:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


const userNotLoggedIn = async (req, res, next) => {
  try {
    if (!req.session.user) {
      next();
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error);
  }
};

const userValid = async (req, res, next) => {
  try {
    const findUser = () => {
      return new Promise((resolve, reject) => {
        userCollection
          .findOne({ email: req.session.user })
          .then((user) => {
            resolve(user);
          })
          .catch((error) => {
            reject(error);
          });
      });
    };

    findUser()
      .then((user) => {
        if (user && user.blocked) {
          delete req.session.user;
          res.redirect("/");
        } else {
          next();
        }
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  userLoggedIn,
  userNotLoggedIn,
  userValid,
  // userInShop
};
