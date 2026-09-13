let currentUser = null;

// Lắng nghe sự kiện trang web tải xong
document.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
    initLoadProducts();
});

// Hàm khởi tạo và kiểm tra kết nối Firebase trước khi nạp dữ liệu
function initLoadProducts() {
    const productsContainer = document.getElementById("products-container");
    if (!productsContainer) return;

    productsContainer.innerHTML = "<p class='text-center mt-3 fs-5 text-secondary'><i class='fa-solid fa-spinner fa-spin'></i> Đang tải dữ liệu sách...</p>";

    if (typeof db === "undefined") {
        setTimeout(loadProducts, 500);
    } else {
        loadProducts();
    }
}

// Lấy danh sách sách từ Firestore
function loadProducts() {
    const productsContainer = document.getElementById("products-container");

    if (typeof db === "undefined") {
        productsContainer.innerHTML = "<p class='text-danger text-center mt-3 fs-5'>Lỗi: Chưa kết nối được Firebase (db)!</p>";
        return;
    }

    db.collection("Books").get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                productsContainer.innerHTML = "<p class='text-center mt-3 text-muted fs-5'>Chưa có sách nào trong hệ thống.</p>";
                return;
            }

            productsContainer.innerHTML = ""; // Xóa dòng chữ đang tải

            querySnapshot.forEach((doc) => {
                const book = doc.data();
                const bookId = doc.id; // Lấy ID của document trên Firestore

                // Tạo Card hiển thị thông tin sách + Nút Read More chuyển hướng chuẩn
                const productCard = `
                    <div class="card mb-3 shadow-sm bg-white">
                        <div class="row g-0">
                            <div class="col-md-2 d-flex justify-content-center align-items-center p-3">
                                <img 
                                    src="${book.thumbnail_url || 'https://via.placeholder.com/150'}" 
                                    class="img-fluid rounded bg-white" 
                                    alt="${book.name || 'Book'}"
                                    style="max-height: 140px; object-fit: cover;"
                                >
                            </div>
                            <div class="col-md-8">
                                <div class="card-body bg-white">
                                    <h5 class="card-title fw-bold text-primary">${book.name || "Chưa có tên sách"}</h5>
                                    <p class="card-text mb-1"><b>Author:</b> ${book.author || "N/A"}</p>
                                    <p class="card-text mb-1"><b>Category:</b> ${book.category || "N/A"}</p>
                                    <p class="card-text mb-1"><b>Publish Date:</b> ${book.published_date || "N/A"}</p>
                                    <p class="card-text text-secondary small mt-2">${book.description || ""}</p>
                                </div>
                            </div>
                            <div class="col-md-2 d-flex justify-content-center bg-white align-items-center">
                                <!-- NÚT READ MORE ĐÃ ĐƯỢC CHUYỂN THÀNH THẺ <a> ĐỂ NẢY TRANG -->
                                <a href="./info.html?id=${bookId}" class="btn btn-primary px-3 py-2 me-2">
                                    <i class="fa-solid fa-book-open me-1"></i> Read more
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                productsContainer.innerHTML += productCard;
            });
        })
        .catch((error) => {
            console.error("Lỗi lấy dữ liệu Firestore:", error);
            productsContainer.innerHTML = `<p class='text-danger text-center mt-3 fs-5'>Lỗi kết nối Firestore: ${error.message}</p>`;
        });
}

// Kiểm tra trạng thái đăng nhập người dùng
function checkAuthState() {
    if (typeof firebase === "undefined" || !firebase.auth) return;

    firebase.auth().onAuthStateChanged((user) => {
        const userDropdown = document.getElementById("user-dropdown");
        const userEmail = document.getElementById("user-email");
        const btnLogout = document.getElementById("btn-logout");

        if (user) {
            currentUser = user;
            if (userEmail) userEmail.textContent = user.email;
            if (userDropdown) userDropdown.classList.remove("d-none");
            if (btnLogout) {
                btnLogout.onclick = logout;
            }
        } else {
            if (userDropdown) userDropdown.classList.add("d-none");
        }
    });
}

// Hàm đăng xuất
function logout(e) {
    if (e) e.preventDefault();
    firebase.auth().signOut().then(() => {
        alert("Đã đăng xuất thành công!");
        window.location.href = "./signin.html";
    });
}