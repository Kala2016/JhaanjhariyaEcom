const mongoose = require("mongoose");
const loginSchema = new mongoose.Schema ({
  email: {
    required: true,
    type: String,
  },
  password: {
    required: true,
    type: String,
  },
})

const loginCollection = mongoose.model("loginCollection",loginSchema);
module.exports = loginCollection;

