const userCollection = require("../../models/userSchema");
const productCollection = require("../../models/ProductSchema");
const {calculateSubtotal} = require('../../utility/ordercalcalculation')



const checkoutPage = async (req, res) => {
    try {
        // Retrieve user data with cart and addresses
        const user = req.userId;
        console.log(user);
        const userWithCart = await userCollection.findById(user).populate('cart.productId').populate('cart.productId.salePrice');
        const userWithAddress = await userCollection.findById(user).populate('addresses')
        const address = userWithAddress.addresses;

        // Check if the cart is empty
        if (!userWithCart.cart.length) {
            return res.redirect('/shopping-cart');
        }

        // Calculate subtotal and check for out of stock items
        const totalArray = calculateSubtotal(userWithCart);
        if (!totalArray) {
            req.flash('warning', 'OOPS!, Out of Stock');
            return res.redirect('/shopping-cart');
        }

        // Destructure the totalArray for readability
        const [cartItem, cartSubtotal, processingFee,grandTotal] = totalArray;

        // Render the checkout page with data
        res.render("users/pages/checkoutPage", {
            cartItem,            
            cartSubtotal,
            processingFee,
            grandTotal,         
            address
        });

        console.log("cartItem---:", cartItem);
        console.log("gradTotal---:", grandTotal);
        console.log("cartSubtotal---", cartSubtotal);

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};


const placeOrder = async(req,res)=>{

    try {

        const user = req.userId;
        const {address ,paymentmethod} = req.body

        const userWithCart = await userCollection.findById(user).populate("cart.productId")

        if(!userWithCart.cart && userWithCart.cart.length > 0){
            const totalArray = calculateSubtotal(userWithCart);
            if(!totalArray){
                return res.json({outofStock:true, message :'Out of Stock'})
            }
        }

        const [cartItem,cartSubtotal,processingFee,grandTotal] = [...totalArray];

        const orderItems = cartItem.map(item=>({

            product:item.product_id,
            quantity:item.quantity,
            price:item.product.salePrice


        }))


        const newOrder ={
            items: orderItems,
            user: user,             
            orderDate: new Date(),
            billingAddress: address,
            paymentMethod: paymentMethod,
            subtotal: cartSubtotal,
            processingFee: processingFee,
            total: orderTotal
        }






        
    } catch (error) {
        
    }
}







const orderPlacedPage = async(req,res)=>{
    try {

        res.render('users/pages/orders')




        
    } catch (error) {

        console.error(error.message)
        

    }
}




module.exports={
    checkoutPage,
    orderPlacedPage
}





