// Define getStatusClass function
function getStatusClass(status) {
    switch (status) {
        case 'Pending':
            return 'text-warning';
        case 'Shipped':
            return 'text-primary';
        case 'Cancelled':
            return 'text-danger';
        case 'Delivered':
            return 'text-success';
        case 'Returned':
            return 'text-info';
        case 'Refunded':
            return 'text-success';
        default:
            return '';
    }
}

// Export getStatusClass function if you're using it in another file
module.exports = { getStatusClass };
