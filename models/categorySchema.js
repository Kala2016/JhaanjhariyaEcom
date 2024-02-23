const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const categorySchema = new Schema ({
  
  categoryName:{
    required: true,
    type: String,
  
  },
  isListed: {
    type: Boolean,
    default: true,
  }
});

const CategoryCollection = mongoose.model("CategoryCollection", categorySchema);

module.exports = CategoryCollection;
