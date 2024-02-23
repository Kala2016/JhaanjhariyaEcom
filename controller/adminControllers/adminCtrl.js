const userCollection = require("../../models/userSchema");

//Load Login Page
const loadLogin = async (req, res) => {
  try {
    res.render("./admin/pages/login", { title: "Login" });
  } catch (error) {
    console.log(error.message);
  }
};

//Verify Admin Login
const verifyAdmin = async (req, res) => {
  try {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    const emailCheck = req.body.email;
    const user = await userCollection.findOne({ email: emailCheck });

    if (user) {
      res.render("./admin/pages/login", {
        adminCheck: "You are not an Admin",
        title: "Login",
      });
    }
    if (req.body.email === email && req.body.password === password) {
      req.session.admin = email;
      console.log("email", email);
      res.redirect("admin/dashboard");
    } else {
      res.render("./admin/pages/login", {
        adminCheck: "Invalid Credentials",
        title: "Login",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Load Dashboard
const loadDashboard = async (req, res) => {
  try {
    res.render("./admin/pages/dashboard", {
      title: "Dashboard",
    });
  } catch (error) {
    console.log(error.message);
  }
};

//Logout Admin

const logout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};


const adminProfile = async (req, res) => {
  try {
    res.render("./admin/pages/adminProfile");
  } catch (error) {
    console.log(error.message);
  }
};





module.exports = {
  loadLogin,
  verifyAdmin,
  loadDashboard,
  logout,
  adminProfile,
};
