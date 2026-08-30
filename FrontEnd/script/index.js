window.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
    loadProducts();
});


function loadProducts() {
    const productsContainer = document.getElementById("product-list");
    productsContainer.innerHTML = ""; // Clear existing products

    db.collection("products").get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                // Create product card HTML
                const productCard = `
                    <div class="card">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description}</p>
                            <p class="card-text fw-bold">${product.price.toFixed(2)} VND</p>
                            <a href="#" class="btn btn-primary">Buy now</a>
                        </div>
                    </div>
                `;
                productsContainer.innerHTML += productCard;
            });
        });
}





function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            document.getElementById("user-email").textContent = user.email;
            document.getElementById("user-dropdown").classList.remove("d-none");
            document.getElementById("btn-logout").addEventListener("click", logout);
        } else {
            document.getElementById("user-dropdown").classList.add("d-none");
        }
    });
}

function logout() {
    firebase.auth().signOut().then(() => {
        alert("User signed out successfully.");
        window.location.href = "./signin.html"; // Redirect to login page or home page
    }).catch((error) => {
        console.error("Error signing out:", error);
        alert("Error signing out. Please try again.");
    });
}