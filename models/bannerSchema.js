const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    bannerImage: String,         
        

    title:{
        type:String,
        required:true
    },
    productUrl:{
        type:String,
        required:true
    },
    description: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Banner', bannerSchema);
