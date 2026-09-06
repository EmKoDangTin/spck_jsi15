document.addEventListener("DOMContentLoaded", () => {
    // checkAuthState();
    loadProducts();
});



document.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-edit")) {
        const productId = event.target.getAttribute("data-id");
        console.log("Edit product:", productId);
    }
    if (event.target.classList.contains("btn-delete")) {
        const productId = event.target.getAttribute("data-id");
        console.log("Delete product:", productId);
    }
});


function loadProducts() {
    const productsContainer = document.getElementById("products-container");

    if (!productsContainer) {
        console.error("Không tìm thấy products-container");
        return;
    }

    productsContainer.innerHTML = "";

    db.collection("Books")
        .get()
        .then((querySnapshot) => {

            if (querySnapshot.empty) {
                productsContainer.innerHTML = "<p>Không có sách nào.</p>";
                return;
            }
            querySnapshot.forEach((doc) => {
                const book = doc.data();
                console.log("Book:", book);
                const productCard = `
                    <div class="card mb-3">
                        <div class="row g-0">
                            <div class="col-md-2 d-flex justify-content-center align-items-center">
                                <img 
                                    src="${book.thumbnail_url || 'https://via.placeholder.com/150'}"
                                    class="img-fluid rounded-start"
                                    alt="${book.name || 'Book'}"
                                >
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title">
                                        ${book.name || "Không có tên"}
                                    </h5>
                                    <p class="card-text">
                                        <b>Tác giả:</b>
                                        ${book.author || "Không rõ"}
                                    </p>
                                    <p class="card-text">
                                        <b>Thể loại:</b>
                                        ${book.category || "Không rõ"}
                                    </p>
                                    <p class="card-text">
                                        <b>Ngày xuất bản:</b>
                                        ${book.published_date || "Không rõ"}
                                    </p>

                                </div>
                            </div>
                            <div class="col-md-2 d-flex justify-content-center align-items-center">
                                <button 
                                    class="btn btn-warning btn-edit"
                                    data-id="${doc.id}">
                                    <i class="fa-solid fa-pen"></i>
                                    Edit
                                </button>
                                <button 
                                    class="btn btn-danger ms-2 btn-delete"
                                    data-id="${doc.id}">
                                    <i class="fa-solid fa-trash"></i>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                productsContainer.innerHTML += productCard;
            });
        })
        .catch((error) => {
            console.error("Lỗi khi lấy sách:", error);
            productsContainer.innerHTML =
                `<p class="text-danger">Không thể tải dữ liệu sách.</p>`;
        });
}

function updateProduct(productId, updatedData) {
    db.collection("products").doc(productId).update(updatedData)
        .then(() => {
            console.log("Product updated successfully!");
            loadProducts(); // Reload products after update
        })
        .catch((error) => {
            console.error("Error updating product: ", error);
        });
}
