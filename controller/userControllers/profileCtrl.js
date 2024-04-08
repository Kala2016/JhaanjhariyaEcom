const userCollection = require("../../models/userSchema")
const Wallet = require("../../models/walletSchema")
const  bcrypt = require('bcrypt');



// const getUserProfilePage = async (req, res) => {
//     try {
//         const user = req.session.user;
//         const userData = await userCollection.findOne({ email: user.email });

//         if (!userData) {
//             return res.status(404).send("User not found");
//         }
//         console.log('user data', userData);
//         res.render('users/pages/userProfile',  {userData} );
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).send("Internal Server Error");
//     }
// }

const getUserProfilePage = async (req, res) => {
    try {
        const user = req.userId;
        const userData = await userCollection.findOne({ email: user.email });
        const findWallet = await userCollection.findById(user).populate('wallet');
        let walletBalance = 0;
        console.log(userData);

        if (findWallet.wallet) {
            const walletId = findWallet.wallet._id;
            const wal = await Wallet.find(walletId).populate('transactions').exec();
            walletBalance = findWallet.wallet.balance;
        }

        res.render('users/pages/userProfile', {userData, walletBalance });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}


const viewWallethistory = async(req,res)=>{
    try {

        const user = req.session.user;
        const findWallet = await userCollection.findById(user).populate('wallet')
        let walletHistory = false;
        if(findWallet.wallet){
            const walletId = findWallet.wallet._id;
            const walletTransaction = await Wallet.findById({_id:walletId}) 
            .populate ({
                path:'transactions',
                options: {
                    sort:{
                        timestamp:-1
                    }

                }

            })
            walletHistory = walletTransaction.transactions
        }

        res.render('users/pages/walletHistory',{walletHistory})



        
    } catch (error) {

        console.error(error)
        
    }
}

    

const uploadDp = async (req,res)=>{

    try {

        const image = req.file.filename
        console.log(req.file);

        const  updated= await userCollection.findByIdAndUpdate({_id:req.session.userId} ,{$set:{image_url:image}})

        if(updated){
            res.status(200).json({success:true,message:"Successfully Updated",newImageUrl:image}); 
        }else{  
               throw new Error("Error");
        }                              
               
    } catch (error) {

       res.status(500).json('Internal Server Error')
       console.error(error.message)
        
    }

}

const geteditProfile =async( req,res)=>{
    try {
        const user = await userCollection.findById(req.user._id)
        res.status(200)
        res.render("users/pages/userProfile")
        
    } catch (error) {

        res.status(500).json('Internal Server error')
        console.error(error.message)
        
    }
}


const editProfile = async (req, res) => {
    try {
        const { fname, lname, email, mobile } = req.body;
        console.log('Request Body', req.body)

        // Check if req.user exists before accessing its properties
        if (!req.userId) {
            return res.status(400).json({ message: "User not found", success: false });
        }

        // Update user profile based on the provided data
        await userCollection.findByIdAndUpdate(req.userId, {
            fname: fname,
            lname: lname,
            email: email,
            mobile: mobile
        });

        return res.redirect('/userProfile');
    } catch (error) {
        // Handle any errors that occur during the update process
        console.error(error);
        return res.status(500).json('Internal Server Error');
    }
}




// password Change Page
const changePasswordPage =async(req,res)=>{

    try {

        res.render('users/pages/changePassword')
        
    } catch (error) {
        console.error(error.message)
    }

}


const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        // Find the user by session ID or any other identifier
        const user = await userCollection.findById(req.session.user._id);
        if (!user) {
            return res.status(400).json({ message: "User not found", success: false });
        }

        // Compare old password with the password stored in the database
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Old password does not match", success: false });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password in the database
        await userCollection.findByIdAndUpdate(user._id, { $set: { password: hashedNewPassword } });

        // Redirect to login page after successfully changing password
        res.redirect('/login');
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error!");
    }
};






module.exports ={
    getUserProfilePage,
    uploadDp,
    geteditProfile,
    editProfile,
    changePasswordPage,
    changePassword,
    viewWallethistory

}