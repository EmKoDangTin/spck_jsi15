document.addEventListener("DOMContentLoaded", () => {
    // Đợi Firebase sẵn sàng trước khi load dữ liệu
    checkFirebaseReady();
});

function checkFirebaseReady() {
    if (typeof db === "undefined") {
        console.warn("Đang chờ Firebase khởi tạo...");
        setTimeout(checkFirebaseReady, 300); // Thử lại sau 0.3s nếu chưa xong
    } else {
        fetchBookDetail();
    }
}

function fetchBookDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get("id");
    const container = document.getElementById("book-detail-container");

    if (!container) return;

    if (!bookId) {
        container.innerHTML = `
            <div class="alert alert-danger text-center mt-4">
                <h4>Không tìm thấy ID sách!</h4>
                <a href="./index.html" class="btn btn-primary mt-3">Quay lại trang chủ</a>
            </div>`;
        return;
    }

    // Lấy dữ liệu sách theo ID từ Collection "Books"
    db.collection("Books").doc(bookId).get()
        .then((doc) => {
            if (!doc.exists) {
                container.innerHTML = `
                    <div class="alert alert-warning text-center mt-4">
                        <h4>Sách này không tồn tại hoặc đã bị xóa!</h4>
                        <a href="./index.html" class="btn btn-primary mt-3">Quay lại trang chủ</a>
                    </div>`;
                return;
            }

            const book = doc.data();

            // Render giao diện chi tiết sách
            container.innerHTML = `
                <div class="card shadow-lg p-4 border-0 rounded-4">
                    <div class="row g-4">
                        <!-- Ảnh bìa -->
                        <div class="col-md-4 text-center d-flex align-items-center justify-content-center bg-white p-3 rounded">
                            <img src="${book.thumbnail_url || 'https://via.placeholder.com/300x400'}" 
                                 class="img-fluid rounded shadow" 
                                 alt="${book.name || 'Book Image'}"
                                 style="max-height: 400px; object-fit: contain;">
                        </div>

                        <!-- Chi tiết thông tin -->
                        <div class="col-md-8 d-flex flex-column justify-content-between">
                            <div>
                                <h1 class="fw-bold text-primary mb-3">${book.name || "Chưa có tên sách"}</h1>
                                
                                <div class="mb-3 fs-5">
                                    <p class="mb-2"><strong><i class="fa-solid fa-user-pen text-secondary me-2"></i>Tác giả:</strong> ${book.author || "Không rõ"}</p>
                                    <p class="mb-2"><strong><i class="fa-solid fa-layer-group text-secondary me-2"></i>Thể loại:</strong> <span class="badge bg-info text-dark">${book.category || "Không rõ"}</span></p>
                                    <p class="mb-2"><strong><i class="fa-regular fa-calendar-days text-secondary me-2"></i>Ngày xuất bản:</strong> ${book.published_date || "Không rõ"}</p>
                                </div>

                                <hr>

                                <div class="mt-3">
                                    <h5 class="fw-bold">Mô tả sách:</h5>
                                    <p class="text-secondary leading-relaxed fs-6" style="white-space: pre-line;">
                                        ${book.description || "Chưa có mô tả cho cuốn sách này."}
                                    </p>
                                </div>
                            </div>

                            <!-- Nút điều hướng -->
                            <div class="pt-4 border-top d-flex gap-3">
                                <a href="./index.html" class="btn btn-outline-secondary btn-lg px-4">
                                    <i class="fa-solid fa-arrow-left me-2"></i>Quay lại trang chính
                                </a>
                                
                                <a href="${book.read_url || '#'}" target="_blank" class="btn btn-success btn-lg px-4 flex-grow-1">
                                    <i class="fa-solid fa-book-open-reader me-2"></i>Đọc sách ngay
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch((error) => {
            console.error("Lỗi lấy thông tin sách:", error);
            container.innerHTML = `<div class="alert alert-danger text-center mt-4">Lỗi tải dữ liệu: ${error.message}</div>`;
        });
}