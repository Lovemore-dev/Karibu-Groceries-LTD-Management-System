// Get form elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('UserName');
const passwordInput = document.getElementById('enterPassword');
// const loginButton = document.getElementById('loginBtn');
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
  eyeIcon.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      eyeIcon.className = 'fas fa-eye-slash';
    } else {
      passwordInput.type = 'password';
      eyeIcon.className = 'fas fa-eye';
    }
  });
}
// Toast notification function

function showToast(message, type) {
  const toast = document.getElementById('toast');

  // 1. Set the text
  toast.innerText = message;

  // 2. Reset classes to base, then add the specific type
  // This ensures we don't have both 'success' and 'error' at the same time
  toast.className = ''; // clear previous classes

  if (type === 'success') {
    toast.classList.add('success');
  } else if (type === 'error') {
    toast.classList.add('error');
  }

  // 3. Add 'show' class to trigger the CSS animation
  // We use a small timeout to ensure the browser processes the class change
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 4. Hide it after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

addPasswordToggle();

// validate user details
const validateUser = () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const users = {
    kgl_admin: { role: 'Manager', password: 'groceries2026' },
  };

  // check if either field is empty
  if (username === '' || password === '') {
    showToast('Please enter both username and password!', 'error');
    return;
  }
  // if user exists
  if (!users[username]) {
    showToast(`Username does not exist. Please try again.`, `error`);
    return;
  }
  // if password matches
  if (users[username].password !== password) {
    showToast(`Incorrect password. Please try again.`, `error`);
    return;
  }
  // successfull condition
  showToast(`Login successful!`, `success`);

  // Store user details in local storage
  const userDetails = {
    username,
    firstName: 'Lovemore',
    lastname: 'Odongo',
    role: users[username].role,
  };
  localStorage.setItem('userDetails', JSON.stringify(userDetails));
  window.location.href = '/pages/dashboard.html';
};
// Handle form submission
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  validateUser();
});
