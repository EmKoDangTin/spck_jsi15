const btnSignUp = document.getElementById("registerBtn");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        alert("User is signed in: " + user.email);
        window.location.href = "./index.html"; // Redirect to home page or dashboard
    } 
});

btnSignUp.addEventListener("click", async (e) => {
  e.preventDefault(); //Ngăn cho form submit lại trang

  //Lấy dữ liệu từ form
  const email = document.getElementById("txt-email").value;
  const password = document.getElementById("txt-password").value;
  const confirmPassword = document.getElementById("txt-confirm-password").value;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }

  //Kiểm tra email đã tồn tại chưa
  firebase.auth().fetchSignInMethodsForEmail(email)
    .then((methods) => {
      if (methods.length > 0) {
        alert("Email already exists. Please use a different email.");
        return;
      }
    })
    .catch((error) => {
      console.error("Error checking email:", error);
      alert("Error checking email. Please try again.");
    });

  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      alert("Sign up successful! You can now log in.");
      // Optionally, redirect to login page or home page
      window.location.href = "./signin.html";
    })
    .catch((error) => {
      console.error("Error signing up:", error);
      alert("Error signing up. Please try again.");
    });
});
