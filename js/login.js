// Get form elements
const form = document.querySelector('form');
const emailInput = document.getElementById('workEmail');
const passwordInput = document.getElementById('enterPassword');
const loginButton = document.querySelector('.submitButton');

// Add password toggle
function addPasswordToggle() {
  const eyeIcon = document.createElement('i');
  eyeIcon.className = 'fas fa-eye';

  // Style eye icon
  eyeIcon.style.cssText =
    'position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;';

  // Wrap password input
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';

  // Put password input and eye icon together
  passwordInput.parentNode.insertBefore(wrapper, passwordInput);
  wrapper.appendChild(passwordInput);
  wrapper.appendChild(eyeIcon);

  // Toggle password visibility
  eyeIcon.addEventListener('click', function () {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeIcon.className = 'fas fa-eye-slash';
    } else {
      passwordInput.type = 'password';
      eyeIcon.className = 'fas fa-eye';
    }
  });
}

// Validate email
function validateEmail() {
  const email = emailInput.value.trim();

  if (!email) {
    alert('Please enter your email');
    return false;
  }

  if (!email.includes('@') || !email.includes('.')) {
    alert('Please enter a valid email having @ and .');
    return false;
  }

  return true;
}

// Validate password
function validatePassword() {
  const password = passwordInput.value;

  if (!password) {
    alert('Please enter your password');
    return false;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return false;
  }

  return true;
}

// Handle login
function handleLogin() {
  // Validate
  if (!validateEmail() || !validatePassword()) {
    return;
  }

  // Get values
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Show loading
  loginButton.disabled = true;
  loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  // Simulate login
  setTimeout(function () {
    // Demo credentials
    if (email === 'admin@karibu.com' && password === 'demo123') {
      alert('Login successful! Welcome to Karibu Groceries.');
      emailInput.value = '';
      passwordInput.value = '';
    } else {
      alert('Login failed. Try: admin@karibu.com / demo123');
      passwordInput.value = '';
    }

    // Reset button
    loginButton.disabled = false;
    loginButton.innerHTML = 'Login';
  }, 1500);
}

// Setup everything
function init() {
  // Add password toggle
  addPasswordToggle();

  // Handle form submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handleLogin();
  });

  // Press Enter to submit
  document.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
}

// Start when page loads
window.addEventListener('DOMContentLoaded', init);
