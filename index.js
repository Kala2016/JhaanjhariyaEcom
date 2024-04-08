const express = require("express");
const path = require("path");
const app = express();
const session = require("express-session");
const nocache = require("nocache");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv").config();
const logger = require("morgan");
const mongoose = require("mongoose");
const connectFlash = require("connect-flash");
const cookieParcer = require("cookie-parser");

const PORT = process.env.PORT || 4000;

const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");
const { notFound, errorHandler } = require("./middlewares/errorHandlers");

// dbConnect();
const dbConnect = require("./config/dbConnect");

app.use(logger("dev"));
app.use(nocache());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParcer());
app.use("/uploads", express.static("uploads"));

//setting

app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
// app.set("views", [
//   path.join(__dirname, "views/user"),
//   path.join(__dirname, "views")
// ]);
app.set("views", path.join(__dirname, "views"));
// app.set('views', path.join(__dirname, "/views/admin/pages/")),
// app.set('views', path.join(__dirname, "/views/users/pages/"));
// for user session activity checking

app.use(
  session({
    secret: uuidv4(),
    resave: false,
    rolling: false,
    saveUninitialized: true,
    maxAge: Date.now() + 30 * 86400 * 1000,
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// app.use('/search',searchRouter);

// using for sending message to ejs
app.use(connectFlash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

//for user Routes
app.use("/", userRoute);

//for admin Route
app.use("/admin", adminRoute);

// app.use('*', (req, res) => { res.render('users/pages/404') })

//Server

app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});
