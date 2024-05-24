const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    filename: String,
    thumbnailUrl: String,
    imageUrl: String,
});

module.exports = mongoose.model("Images", imageSchema);