const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const collectionSchema = new Schema ({
  
  collectionName:{
    required: true,
    type: String,
    
  },
  isListed: {
    type: Boolean,
    default: true,
  }
  
  
});

const CollectionModel = mongoose.model("CollectionModel", collectionSchema);

module.exports = CollectionModel;
