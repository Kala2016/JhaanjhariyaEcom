const address = require("../../models/addressSchema");
const userCollection = require("../../models/userSchema");
const bcrypt = require("bcrypt")

const addAddressPage = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await userCollection.findOne({ email: user.email });
    const addresses = userData.addresses;

    res.render("users/pages/addAddress", { addresses: addresses });
  } catch (error) {
    console.error(error.message);
  }
};

const insertAddress = async (req, res) => {
  try {
    const userEmail = req.session.user;
    console.log("User email:", userEmail);

    const userId = req.session.user._id;
    console.log("User ID:", userId);

    const user = await userCollection.findOne({ _id: userId });
    console.log("User:", user);

    const addressFound = await userCollection.findOne({
      email: userEmail,
      "addresses.address_name": req.body.name,
    });
    console.log("Address found:", addressFound);

    if (!addressFound) {
      const newAddress = {
        addressType: req.body.addressType, // Include addressType
        address_name: req.body.name,        
        house_name: req.body.house,
        street_address: req.body.street,
        state: req.body.state,
        city: req.body.city,
        pincode: req.body.pincode,
        phone: req.body.phone,
        alt_phone: req.body.altphone,
      };
      console.log("New address:", newAddress);

      user.addresses.push(newAddress);
      const userData = await user.save();
      console.log("User data after adding address:", userData);

      if (userData) {
        res.status(200).json({
          success: true,
          message: "Address added successfully!",
          user: userData,
        });
      }
    } else {
      res.status(200).json({
        message: "Address with the name already exists!",
        success: false,
      });
    }
  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).send("Internal server error");
  }
};

const editAddressPage = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;

    const user = await userCollection.findOne({ _id: userId });
    
    // Find the address with the given ID from the user's addresses array
    const editData = user.addresses.find(address => address._id == addressId);

    if (!editData) {
      // If address not found, handle the error or send an appropriate response
      return res.status(404).send("Address not found");
    }

    res.render("users/pages/editAddress", { editData: editData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal server error");
  }
};


const updateAddress = async (req, res) => {
  try {
    const id = req.params.id;
    // Extract address details from the request body
    const { name, address, town, state, postCode, phone, altPhone } = req.body;
    // Update the address details in the database
    await userCollection.updateOne({ "_id": id }, { $set: { name, address, town, state, postCode, phone, altPhone } });
    // Redirect or send response as needed
    res.redirect('/userProfile');
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};



const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;

    const updatedUser = await userCollection.findOneAndUpdate(
      { _id: userId },
      { $pull: { addresses: { _id: addressId } } }
    );

    if (updatedUser) {
      res.status(200).json({ message: "Address deleted successfully!", success: true });
    } else {
      res.status(400).json({ message: "Address not found", success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server Error!" });
  }
};




module.exports = {
  addAddressPage,
  insertAddress,
  deleteAddress,
  editAddressPage,
  updateAddress,
  
};
