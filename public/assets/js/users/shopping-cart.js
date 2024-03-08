// // sweet Alert when deleting a product from the cart
// function showConfirmation(productId) {
//     Swal.fire({
//         title: 'Are you sure?',
//         text: 'You are about to remove this item from your cart.',
//         icon: 'warning',
//         showCancelButton: true,
//         confirmButtonColor: '#3085d6',
//         cancelButtonColor: '#d33',
//         confirmButtonText: 'Yes, remove it!'
//     }).then((result) => {
//         if (result.isConfirmed) {
//             // If the user clicks "Yes," redirect to the removeProduct endpoint
//             window.location.href = "/removeProduct/" + productId;
//         }
//     });
// }


<script src="https://cdn.jsdelivr.net/npm/sweetalert2@10"></script>