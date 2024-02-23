const mongoose = require("mongoose");
const multer = require("multer");

const CollectionModel = require("../../models/collectionSchema");




// render collection page with data
const getCollections = async (req, res) => {
  try {;
      const collections = await CollectionModel.find({})
      res.render("./admin/pages/addCollections",{title:'Collections',collections});
  } catch (error) {
      console.error(error);
  }
};

const postCollection = async (req, res) => {
  try {
    const {collectionName} = req.body
    const collectionData = await CollectionModel.findOne({ collectionName: collectionName });
    // if (!collectionDescription) {
    //   return res.status(400).json({ success: false, message: 'collectionDescription is required' });
    
    if (collectionData) {
      res.status(409).json({ success: false, message: 'Collection already exists' });
    } else {
      const colle =await CollectionModel.create({
        collectionName: collectionName,        
        
      });
      const collections = await CollectionModel.find({});
      res.status(200).json({ success: true, message: 'Collection added successfully', collections });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// edit Category form 
const editCollection = async (req, res) => {

  try {
      const { id } = req.params
      const collectionName = await CollectionModel.findById(id);
      console.log("id",id)
      if (collectionName) {
          res.render('admin/pages/editCollection', { title: 'editCollection', collection: collectionName });
      } else {
          console.log('error in rendering');
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

const updateCollection =async (req, res) => {
  try {
      const id = req.params.id
      const { updatedName } = req.body
      const coll = await CollectionModel.findById(id)
      coll.collectionName = updatedName;
      
      const saved = await coll.save()
      res.redirect('./admin/pages/addCollection')
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}






module.exports ={
    getCollections,
    postCollection,
    editCollection,
    updateCollection
}