const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
    
    ColorName:{
        required: true,
        type: String,
      
      },
      
});



module.exports = mongoose.model("Color", colorSchema);