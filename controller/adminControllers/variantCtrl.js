const productCollection = require("../../models/ProductSchema")



const getVariant= async(req,res)=>{
    try {

        const color = await productCollection.find({})
        res.render('./admin/pages/addVariant',{title:'addVariant'})
        
    } catch (error) {
        console.error(error)
        
    }
}



const addVariant =async(req,res)=>{

   

    try {
        
        const color =await productCollection.create({
            // product_id: req.body.productData.product_id,
            variantName: req.body.variantName,              
            color: req.body.color,              
            productPrice: req.body.productPrice,
            quantity: req.body.quantity,

            
        });
        const variantArray = [];
        for (let i = 1; i <= req.body.variant; i++) {
        variantArray.push({
        color: req.body["color" + i],
        stock: req.body["stock" + i],
        price: req.body["price" + i]
    })
}

        variantArray.forEach(async variant => {
            const variantAdd = new productCollection({
                // product_id: productData._id,
                v_name: `V${i++}`,
                color: variant.color,
                stock: variant.stock,
                price: variant.price
            })
        
            const variantsaved = await variantAdd.save();
            const variantPush = await productCollection.updateOne({ _id: productData._id },
                { $push: { "variants": variantsaved._id } });
        })
        
        if(color){
            return res.redirect('/admin/addVariants')
        }

        
    } catch (error) {

        console.error(error)
        res.status(500).send("Internal Server Error");

        
    }
}

module.exports = {getVariant,

addVariant
};