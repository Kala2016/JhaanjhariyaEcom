const mongoose = require("mongoose");
const multer = require("multer");
const CategoryCollection = require("../../models/categorySchema");




// render category page with data
const getCategory = async (req, res) => {
  try {
      const categories =await CategoryCollection.find()
      res.render("admin/pages/addCategory",{title:'addCategory',categories});
  } catch (error) {
      console.error(error);
      res.status(500).json({success: false,message:'Internal Server Error'})
  }
};

const insertCategory = async (req, res) => {
  try {
    const categoryName = req.body.addCategory;
    const findCat = await CategoryCollection.findOne({ categoryName: { $regex: new RegExp(categoryName, 'i') } });

    if (findCat) {
      const catCheck = `Category ${categoryName} already exists`;
      // Fetch categories and pass them to the template
      const categories = await CategoryCollection.find();
      res.render('./admin/pages/addCategory', { catCheck, categories, title: 'addCategory' });
    } else {
      const result = new CategoryCollection({
        categoryName: categoryName,
      });
      await result.save();

      // Fetch categories and pass them to the template
      const categories = await CategoryCollection.find();
      res.render('./admin/pages/addCategory', {
        message: `Category ${categoryName} added successfully`,
        categories,
        title: 'addCategory',
      });
    }
  } catch (error) {
    console.error(error.message);
  }
};




// list category

const list = async (req, res) => {
  try {

      const id = req.params.id
      console.log(id);

      const listing = await CategoryCollection.findByIdAndUpdate({ _id: id }, { $set: { isListed: true } })
      console.log(listing);
      res.redirect('admin/pages/addCategory')

  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// unlist category
const unList = async (req, res) => {
  try {
      const id = req.params.id
      console.log(id);

      const listing = await CategoryCollection.findByIdAndUpdate({ _id: id }, { $set: { isListed: false } })
      console.log(listing);
      res.redirect('admin/pages/addCategory')

  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }

}

// edit Category form 
const editCategory = async (req, res) => {

  try {
      const { id } = req.params
      const categoryName = await CategoryCollection.findById(id);
      console.log("id",id)
      if (categoryName) {
          res.render('admin/pages/editCategory', { title: 'editCategory', category: categoryName });
      } else {
          console.log('error in rendering');
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

// update Category name and add offer if there is any
const updateCategory =async (req, res) => {
  try {
      const id = req.params.id
      const { updatedName} = req.body
      const cat = await CategoryCollection.findById(id)
      cat.categoryName=updatedName   
      
      const saved = await cat.save()
      res.redirect('/admin/addCategory');
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}


// searchcCategory----
const searchCategory = async (req, res) => {
  console.log(req.body.search);
  try {
      const data = req.body.search
      const searching = await CategoryCollection.find({ categoryName: { $regex: data, $options: 'i' } });
      if (searching) {
          res.render('./admin/pages/addCategories', { title: 'Searching', catList: searching })

      } else {
          res.render('./admin/pages/addCategories', { title: 'Searching' })
      }

  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}



module.exports = {
  getCategory,
  insertCategory,
  searchCategory,
  updateCategory,
  editCategory,
  unList,
  list,
  searchCategory
}