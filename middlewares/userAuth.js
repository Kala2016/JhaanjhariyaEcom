const express = require("express");
const userCollection = require("../models/userSchema");

const userLoggedIn = async (req, res, next) => {
  try {
    console.log(" userLoggedIn middleware");
    if (req.session.user) {
      console.log("Session user found:", req.session.user);
      const user = await userCollection.findById(req.session.user._id);
      console.log("User found in database:", user);
      if (!user.is_Blocked) {
       return  next();
      }
      // res.redirect("/logout", {
      //   error: "Blocked ,You cant access the page",
      // });     
            
    } else { 
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
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
