const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

// const dbConnect = async () => {
//   try {
//      await mongoose.connect('mongodb://localhost:27017/Jhaanjhariya');
//     console.log("Database connected successfully");
//   } catch (error) {
//     console.error("Database connection error:");
//   }
// };
// 


mongoose.connect("mongodb://127.0.0.1:27017/Jhaanjhariya");
let dbConnect =mongoose.connection;
dbConnect.on('connected', () => {
    console.log('Connected to MongoDB');
});
dbConnect.on('error', (err) => {
    console.log(err);
});
module.exports = dbConnect ;