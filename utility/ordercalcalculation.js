function calculateSubtotal(userWithCart) {
    console.log(userWithCart,'user dat in calculate')
    const cartItem = userWithCart.cart.map(cartItem => ({ // Access the cart items and their quantities
        product: cartItem.productId,
        quantity: cartItem.quantity,
        salePrice: cartItem.productId.salePrice,
    }));

    // checking if any of the cart quantity is greater than product quantity it will return true
    const checkingQuantity = cartItem.some(item => item.product && parseFloat(item.product.quantity) < item.quantity);
    if (checkingQuantity) {
        return false;
    }

    // Calculate Cart Subtotal
    const cartSubtotal = cartItem.reduce((total, item) => {
        // Ensure that product exists and has a salePrice property before accessing it
        if (item.product && item.product.salePrice) {
            return total + item.product.salePrice * item.quantity;
        } else {
            return total; // Return total unchanged if product or salePrice is undefined
        }
    }, 0);

    const processingFee = 50;
    const grandTotal = cartSubtotal + processingFee; // Calculate grandTotal

    return [cartItem, cartSubtotal, processingFee, grandTotal]; // Return grandTotal instead of orderTotal
}

module.exports = { calculateSubtotal };
