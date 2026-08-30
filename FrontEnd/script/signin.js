const btnLogin = document.getElementById("btn-login");

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        alert("User is signed in: " + user.email);
        window.location.href = "./index.html"; // Redirect to home page or dashboard
    } 
});

btnLogin.addEventListener("click", async (e) => {
    e.preventDefault(); //Ngăn cho form submit lại trang
    const email = document.getElementById("txt-email").value.trim();
    const password = document.getElementById("txt-password").value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            var user = userCredential.user;
            alert("Login successful! Welcome back.");
            // Optionally, redirect to home page or dashboard
            window.location.href = "./index.html"; // Change this to your desired page
        })
        .catch((error) => {
            console.error("Error logging in:", error);
            alert("Error logging in. Please check your email and password.");
        });
})