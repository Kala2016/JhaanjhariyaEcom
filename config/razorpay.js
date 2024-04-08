const Razorpay = require('razorpay');
const crypto = require('crypto')

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

// creating a newOrder--
const generateRazorPay = (total, orderId) => {
    return new Promise((resolve, reject) => {
        
        var options = {
            amount: total * 100,
            currency: "INR",
            receipt: "" + orderId
        };

        instance.orders.create(options, function (err, order) {
            if (err) {
                console.log('error in creating order', err);
                reject(err);
            } else {
               resolve(order)
            }
        });

    })
}

// verifyingPayment--
const verifyingPayment = (details) => {
    return new Promise((resolve, reject) => {
        let hmac = crypto.createHmac('sha256',process.env.KEY_SECRET);
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id);
        hmac= hmac.digest('hex');
        if (hmac === details.payment.razorpay_signature) {
            resolve(details);
        } else {
            reject("Signature verification failed");
        }
    });
}




module.exports = { generateRazorPay, verifyingPayment }