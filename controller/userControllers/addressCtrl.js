const Address = require("../../models/addressSchema");
const userCollection = require("../../models/userSchema");

const savedAddress = async (req, res) => {
  try {
    const user = req.user;
    const userWithAddresses = await userCollection
      .findById(user)
      .populate("addresses");
    const address = userWithAddresses.addresses;
    res.render("./shop/pages/savedAddress", { address });
  } catch (error) {
    console.error(error.message);
  }
};

const addAddressPage = async (req, res) => {
  try {
    let from = false;
    if (req.query.from) {
      from = req.query.form;
    }

    console.log("from", from);

    res.render("./users/pages/addAddress", { from });
  } catch (error) {
    console.error(error.message);
  }
};

const insertAddress = async (req, res) => {
  try {
    const user = req.user;
    const address = await Address.create(req.body);
    user.addresses.push(address._id);
    await user.save();

    if (req.body.from) {
      return res.redirect("/checkout");
    }

    res.redirect("/savedAddress");
  } catch (error) {
    console.error(error.message);
  }
};

const editAddressPage = async (req, res) => {
  try {
    const id = req.params.id;

    const addData = await Address.findOne({ _id: id });
    if (!addData) {
      return res.status(404).render("/shop/pages/404");
    }
    res.render("/users/pages/editAddress", { addData });
  } catch (error) {
    console.error(error.message);
  }
};


const updateAddress = async(req,res)=>{
    try {
        const id = req.params.id
        const addData = await  Address.findByIdAndUpdate({_id:id},req.body)
        res.redirect('/savedAddress')
    } catch (error) {
        console.error(error.message)
        
    }
}





module.exports = {
  addAddressPage,
  savedAddress,
  insertAddress,
  editAddressPage,
  updateAddress
};
