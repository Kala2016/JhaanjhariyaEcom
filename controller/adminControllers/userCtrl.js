const userCollection = require("../../models/userSchema");

const getUser = async (req, res) => {
  try {
    const findUsers = await userCollection.find();
    res.render("./admin/pages/userList", {
      users: findUsers,
      title: "UserList",
    });
  } catch (error) {
    console.error("error in getUser", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchUser = async (req, res) => {
  try {
    const data = req.body.search;
    const searching = await userCollection.find({
      fname: { $regex: data, $options: "i" },
    });
    res.render("./admin/pages/userList", { users: searching, title: "Search" });
  } catch (error) {
    console.error("error in searchUser", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const id = req.params.id;
    const findUser = await userCollection.findById(id);
    const updateUser = await userCollection.findByIdAndUpdate(
      id,
      { $set: { is_Blocked:!findUser.is_Blocked } },
      { new: true }
    );
    res.redirect("/admin/userList");
  } catch (error) {
    console.error("Error in blockUser", error);
  }
};


module.exports = {
  getUser,
  blockUser,
  searchUser,
};
