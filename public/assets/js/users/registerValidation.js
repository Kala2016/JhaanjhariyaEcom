const message = document.getElementById('message');
const errorMessage = document.getElementById('error-message');

const hide = (element) => { 
  element.style.display = 'none';
}

setTimeout(() => hide(message), 3000);
setTimeout(() => hide(errorMessage), 3000);
function validateForm() {
  const fname = document.getElementById('user-firstname').value;
  const lname  = document.getElementById('user-lastName').value;
  const email = document.getElementById('user-email').value;
  const mobile = document.getElementById('user-mobile').value;
  const password = document.getElementById('user-password').value;
  const confirmpass = document.getElementById('con-pass').value;
 

  const nameRegex = /^[A-Z][a-zA-Z]{3,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   
  if (fname.trim() === '' || email.trim() === '' || password.trim() === '' || confirmpass.trim() === '') {
    errorMessage.textContent = 'All fields are required.';
    errorMessage.style.display = 'block';
    setTimeout(() => hide(errorMessage), 3000);
    return false; // Prevent form submission
  }

  if (fname.trim().length < 4) {
    errorMessage.textContent = 'Name should be at least 4 characters.';
    errorMessage.style.display = 'block';
    setTimeout(() => hide(errorMessage), 3000);
    return false;
  }

  if (!nameRegex.test(fname)) {
    errorMessage.textContent = 'First letter of the name should be capital.';
    errorMessage.style.display = 'block';
    setTimeout(() => hide(errorMessage), 3000);
    return false;
  }

  if (!emailRegex.test(email)) {
    errorMessage.textContent = 'Invalid email format.';
    errorMessage.style.display = 'block';
    setTimeout(() => hide(errorMessage), 3000);
    return false; // Prevent form submission
  }

  if (password !== confirmpass) {
    errorMessage.textContent = 'Passwords do not match.';
    errorMessage.style.display = 'block';
    setTimeout(() => hide(errorMessage), 3000);
    return false; // Prevent form submission
  }

  return true; // Allow form submission
}
