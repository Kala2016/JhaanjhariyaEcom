const Color =require("../adminControllers/variantCtrl");


const getVarint = async(req,res)=>{
    try {

        const color = await Color.find({})
        render('/pages/addVariant',{title:'addVariant'})
        
    } catch (error) {
        console.error(error)
        
    }
}