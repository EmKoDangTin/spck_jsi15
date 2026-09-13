let currentEditingId = null;
let bookModal = null; // Biến lưu thể hiện Bootstrap Modal

document.addEventListener("DOMContentLoaded", () => {
    // Khởi tạo Modal của Bootstrap
    const modalElement = document.getElementById("bookModal");
    if (modalElement) {
        bookModal = new bootstrap.Modal(modalElement);
    }

    loadProducts();
    initSaveEvent();

    // Nút "Add Book" ở góc trên -> Mở Modal dạng Thêm Mới
    const btnAdd = document.getElementById("btn-add-product");
    if (btnAdd) {
        btnAdd.addEventListener("click", () => {
            currentEditingId = null; // Xóa trạng thái Edit
            resetForm();
            document.getElementById("modalTitle").textContent = "Add Book";
            document.getElementById("btn-save").textContent = "Save changes";
            bookModal.show();
        });
    }
});

// Sự kiện Click toàn trang (xử lý Edit và Delete trên danh sách)
document.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".btn-edit");
    const deleteBtn = event.target.closest(".btn-delete");

    if (editBtn) {
        const productId = editBtn.getAttribute("data-id");
        openEditModal(productId);
    }

    if (deleteBtn) {
        const productId = deleteBtn.getAttribute("data-id");
        deleteProduct(productId);
    }
});

// Đọc và đưa dữ liệu sách lên Form Modal khi bấm nút Edit
function openEditModal(productId) {
    db.collection("Books").doc(productId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();

                // Đổ dữ liệu vào các input
                document.getElementById("product-name").value = book.name || "";
                document.getElementById("product-author").value = book.author || "";
                document.getElementById("product-category").value = book.category || "";
                document.getElementById("product-description").value = book.description || "";
                document.getElementById("product-date").value = book.published_date || "";
                document.getElementById("product-image").value = book.thumbnail_url || "";

                // Ghi nhận id đang edit
                currentEditingId = productId;

                // Đổi tiêu đề và nút lưu
                document.getElementById("modalTitle").textContent = "Edit Book";
                document.getElementById("btn-save").textContent = "Update Book";

                // Bật Modal
                bookModal.show();
            }
        })
        .catch((error) => console.error("Lỗi lấy chi tiết sách:", error));
}

// Xử lý nút Save (Cả thêm và sửa)
function initSaveEvent() {
    const btnSave = document.getElementById("btn-save");
    if (!btnSave) return;

    btnSave.addEventListener("click", (e) => {
        e.preventDefault();

        const bookData = {
            name: document.getElementById("product-name").value.trim(),
            author: document.getElementById("product-author").value.trim(),
            category: document.getElementById("product-category").value.trim(),
            description: document.getElementById("product-description").value.trim(),
            published_date: document.getElementById("product-date").value.trim(),
            thumbnail_url: document.getElementById("product-image").value.trim(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (currentEditingId) {
            // Trường hợp Edit
            db.collection("Books").doc(currentEditingId).update(bookData)
                .then(() => {
                    alert("Cập nhật sách thành công!");
                    bookModal.hide();
                    loadProducts();
                })
                .catch((err) => console.error("Lỗi cập nhật:", err));
        } else {
            // Trường hợp Add
            bookData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            db.collection("Books").add(bookData)
                .then(() => {
                    alert("Thêm sách mới thành công!");
                    bookModal.hide();
                    loadProducts();
                })
                .catch((err) => console.error("Lỗi thêm mới:", err));
        }
    });
}

// Xóa Form
function resetForm() {
    const fields = ["product-name", "product-author", "product-category", "product-description", "product-date", "product-image"];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// Lấy danh sách sản phẩm
function loadProducts() {
    const container = document.getElementById("products-container");
    if (!container) return;

    db.collection("Books").get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            container.innerHTML = "<p>Không có sách nào.</p>";
            return;
        }

        container.innerHTML = "";
        querySnapshot.forEach((doc) => {
            const book = doc.data();
            container.innerHTML += `
                <div class="card mb-3">
                    <div class="row g-0">
                        <div class="col-md-2 d-flex justify-content-center align-items-center p-2">
                            <img src="${book.thumbnail_url || 'https://via.placeholder.com/150'}" class="img-fluid rounded">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${book.name || "N/A"}</h5>
                                <p class="card-text mb-1"><b>Author:</b> ${book.author || "N/A"}</p>
                                <p class="card-text mb-1"><b>Category:</b> ${book.category || "N/A"}</p>
                                <p class="card-text mb-1"><b>Release Date:</b> ${book.published_date || "N/A"}</p>
                            </div>
                        </div>
                        <div class="col-md-2 d-flex justify-content-center align-items-center">
                            <button class="btn btn-warning btn-edit" data-id="${doc.id}">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                            <button class="btn btn-danger ms-2 btn-delete" data-id="${doc.id}">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    });
}

// Xóa sản phẩm
function deleteProduct(productId) {
    if (confirm("Bạn có chắc chắn muốn xóa sách này?")) {
        db.collection("Books").doc(productId).delete()
            .then(() => loadProducts())
            .catch((err) => console.error("Lỗi xóa sách:", err));
    }
}