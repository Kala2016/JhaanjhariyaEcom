const Coupon = require("../../models/couponSchema")



const listCoupons = async(req,res)=>{
    try {

        const listCoupons = await Coupon.find()
        res.render('./admin/pages/coupons',{title:'Coupons',coupons:listCoupons})
        
    } catch (error) {
        console.error(error)
    }
}

const addCouponPage = (req,res)=> {
    try {

        res.render('./admin/pages/addCoupon',{title:'Add Coupon'});
        
    } catch (error) {

        console.error(error)
        
    }
}



const createCoupon = async (req,res)=>{
    try {

        console.log('body :>> ', req.body);
        const createCoupon =await Coupon.create(req.body)
        console.log('created coupon',createCoupon);
        res.redirect ("/admin/coupons") 
       // res.send({msg:"
        
    } catch (error) {
        console.error(error)
    }
}

const editCouponPage = async (req,res)=>{
    try {

        const couponId = req.params.id
        
        const findCoupon = await  Coupon.findById({_id:couponId})
        if(findCoupon){
            res.render('./admin/pages/editCoupon',{title:'editCoupon',coupon:findCoupon})
        }else{
            return res.status(404).render('/admin/page404',{title:'404'})

        }
        
    } catch (error) {
        console.error(error)
        
    }
}


const editCoupon =async(req,res)=>{

   try {
    const couponId = req.params.id
    console.log('body',req.body)
    await  Coupon.findByIdAndUpdate(couponId,req.body)
    res.redirect('/admin/coupons')
    
    
   } catch (error) {
    console.error(error)
    
   }


    
}



module.exports ={
    listCoupons,
    addCouponPage,
    createCoupon,
    editCouponPage,
    editCoupon
    
    }