// Get form elements
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("UserName");
const passwordInput = document.getElementById("enterPassword");
// const loginButton = document.getElementById('loginBtn');
// Add password toggle
function addPasswordToggle() {
  const eyeIcon = document.createElement("i");
  eyeIcon.className = "fas fa-eye";

  // Style eye icon
  eyeIcon.style.cssText =
    "position: absolute; right: 15px; top: 50%; transform: translateY(-50%); cursor: pointer; color: #666;";

  // Wrap password input
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";

  // Put password input and eye icon together
  passwordInput.parentNode.insertBefore(wrapper, passwordInput);
  wrapper.appendChild(passwordInput);
  wrapper.appendChild(eyeIcon);

  // Toggle password visibility
  eyeIcon.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.className = "fas fa-eye-slash";
    } else {
      passwordInput.type = "password";
      eyeIcon.className = "fas fa-eye";
    }
  });
}
// Toast notification function

function showToast(message, type) {
  const toast = document.getElementById("toast");

  // 1. Set the text
  toast.innerText = message;

  // 2. Reset classes to base, then add the specific type
  // This ensures we don't have both 'success' and 'error' at the same time
  toast.className = ""; // clear previous classes

  if (type === "success") {
    toast.classList.add("success");
  } else if (type === "error") {
    toast.classList.add("error");
  }

  // 3. Add 'show' class to trigger the CSS animation
  // We use a small timeout to ensure the browser processes the class change
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // 4. Hide it after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Function to connect to the server and get data from mongodb
const loginUser = async (credentials) => {
  try {
    const response = await fetch("http://localhost:3000/api/user/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.json();

    if (response.ok) {
      showToast("Login successful!", "success");

      // Store the JWT token and user info from MongoDB
      localStorage.setItem("token", result.token);
      localStorage.setItem("userDetails", JSON.stringify(result.user));

      // Redirect ONLy after successful response
      setTimeout(() => {
        window.location.href = "/Frontend/html/dashboard.html";
      }, 1000);
    } else {
      showToast(result.message || "Unauthorized", "error");
    }
  } catch (error) {
    console.error("Error:", error);
    showToast("Server is offline or unreachable", "error");
  }
};
// validate user details
const validateUser = () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // check if either field is empty
  if (username === "" || password === "") {
    showToast("Please enter both username and password!", "error");
    return;
  }
 
  loginUser({ username, password });
  // successfull condition
  showToast(`Login successful!`, `success`);
};

// initialization
addPasswordToggle();
// Handle form submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  validateUser();
});
