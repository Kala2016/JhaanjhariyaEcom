const userCollection = require("../../models/ImageSchema")



const getUserProfilePage = async (req,res)=>{

    try {
        res.render('./users/pages/userProfile')
    } catch (error) {
        console.error('Internal Server Error')
        
    }

}


module.exports ={
    getUserProfilePage
}