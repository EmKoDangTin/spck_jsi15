const btnLogin = document.getElementById("btn-login");

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

btnLogin.addEventListener("click", async (e) => {
    e.preventDefault(); //Ngăn cho form submit lại trang
    const email = document.getElementById("txt-email").value.trim();
    const password = document.getElementById("txt-password").value.trim();

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            var user = userCredential.user;
            showNotification(
            "Login Successful",
            "Welcome back.",
            "success"
            );
            // Optionally, redirect to home page or dashboard
            window.location.href = "./index.html"; // Change this to your desired page
        })
        .catch((error) => {
            console.error("Error logging in:", error);
            showNotification(
                "Login Error",
                "Invalid email or password. Please try again.",
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