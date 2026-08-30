console.log("SIGNUP JS RUNNING");
const btnSignUp = document.getElementById("registerBtn");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        showNotification(
            "Login Successful",
            "You are now logged in.",
            "success"
        );
        window.location.href = "./index.html"; // Redirect to home page or dashboard
    } 
});

btnSignUp.addEventListener("click", async (e) => {
  e.preventDefault(); //Ngăn cho form submit lại trang

  //Lấy dữ liệu từ form
  const email = document.getElementById("txt-email").value;
  const password = document.getElementById("txt-password").value;
  const confirmPassword = document.getElementById("txt-confirm-password").value;

  if (email === "" || password === "" || confirmPassword === "") {
    showNotification(
      "Input Error",
      "Please check your email and passwords.",
      "error"
    );
    return;
  }

  if (password !== confirmPassword) {
    showNotification(
      "Password Error",
      "Passwords do not match!",
      "error"
    );
    return;
  }

  if (password.length < 6) {
    showNotification(
      "Password Error",
      "Password must be at least 6 characters long!",
      "error"
    );
    return;
  }

  //Kiểm tra email đã tồn tại chưa
  firebase.auth().fetchSignInMethodsForEmail(email)
    .then((methods) => {
      if (methods.length > 0) {
        showNotification(
          "Email Error",
          "Email already exists. Please use a different email.",
          "error"
        );
        return;
      }
    })
    .catch((error) => {
      console.error("Error checking email:", error);
      showNotification(
        "Email Error",
        "Error checking email. Please try again.",
        "error"
      );
    });

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      showNotification(
        "Sign Up Successful",
        "You can now log in.",
        "success"
      );
      // Optionally, redirect to login page or home page
      window.location.href = "./signin.html";
    })
    .catch((error) => {
      console.error("Error signing up:", error);
      showNotification(
        "Sign Up Error",
        "Error signing up. Please try again.",
        "error"
      );
    });
})



const notification = document.getElementById("notification");
const notificationTitle = document.getElementById("notification-title");
const notificationMessage = document.getElementById("notification-message");
const notificationIcon = document.getElementById("notification-icon");
const notificationClose = document.getElementById("notification-close");

let notificationTimeout;

function showNotification(title, message, type = "error") {

    notificationTitle.textContent = title;
    notificationMessage.textContent = message;

    if (type === "success") {
        notificationIcon.textContent = "✓";
        notificationIcon.style.background = "#22c55e";
    } 
    else {
        notificationIcon.textContent = "!";
        notificationIcon.style.background = "#dc3545";
    }

    notification.classList.add("show");

    clearTimeout(notificationTimeout);

    notificationTimeout = setTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}

notificationClose.addEventListener("click", () => {
    notification.classList.remove("show");
});

