const userCollection = require("../../models/userSchema")



const getUserProfilePage = async (req,res)=>{

    try {
        const user =req.session.user
        console.log("user",user)
        const userData = await userCollection.findOne({email:user.email});
        console.log("userData",userData)
        res.status(200);
        res.render('./users/pages/userProfile',{userData})
    } catch (error) {
        console.error('Internal Server Error==')
        
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
       console.log(error.message)
        
    }

}

const geteditProfile =async( req,res)=>{
    try {
        const user = await userCollection.findById(req.userId)
        res.status(200)
        res.render("user/profile")
        
    } catch (error) {

        res.status(500).json('Internal Server error')
        
    }
}


const editProfile = async (req,res)=>{
    try {
        const {fname,lname,email,mobile,}= req.body

        await userCollection.findByIdAndUpdate(req.user._id),{
            fname:fname,
            lname:lname,
            email:email,
            mobile:mobile


        }

        return  res.redirect('/users/pages/userProfile')

        
    } catch (error) {
        res.status(500).json('Internal Server Error')
        
    }
}



module.exports ={
    getUserProfilePage,
    uploadDp,
    geteditProfile,
    editProfile

}