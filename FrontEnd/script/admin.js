
const API_URL = "http://localhost:3000";

// Giới hạn phía client để báo lỗi sớm. Backend vẫn là nơi kiểm tra chính thức.
const MAX_PDF_MB = 10;
const MAX_IMAGE_MB = 5;

const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="200"><rect width="100%" height="100%" fill="#e9ecef"/><text x="50%" y="50%" fill="#6c757d" font-family="sans-serif" font-size="14" text-anchor="middle">No cover</text></svg>'
    );

let currentEditingId = null;
let currentEditingBook = null; // dữ liệu sách đang sửa (để biết ảnh bìa lấy từ đâu)
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
            currentEditingBook = null;
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

// Chống chèn HTML khi in dữ liệu người dùng nhập vào template string
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[c]));
}

function setHint(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Gửi 1 file lên backend Express -> Cloudinary, trả về JSON { url, public_id, ... }
async function uploadFile(endpoint, fieldName, file) {
    const formData = new FormData();
    formData.append(fieldName, file);

    let res;
    try {
        res = await fetch(`${API_URL}${endpoint}`, { method: "POST", body: formData });
    } catch (err) {
        throw new Error(`Không kết nối được server (${API_URL}). Backend đã chạy chưa?`);
    }

    let data = {};
    try {
        data = await res.json();
    } catch (err) {
        // server trả không phải JSON, dùng thông báo mặc định bên dưới
    }

    if (!res.ok) {
        const detail = data.error ? `: ${data.error}` : "";
        throw new Error((data.message || `Upload lỗi (HTTP ${res.status})`) + detail);
    }

    return data;
}

// Đọc và đưa dữ liệu sách lên Form Modal khi bấm nút Edit
function openEditModal(productId) {
    db.collection("Books").doc(productId).get()
        .then((doc) => {
            if (doc.exists) {
                const book = doc.data();

                // Đổ dữ liệu vào các input chữ
                document.getElementById("product-name").value = book.name || "";
                document.getElementById("product-author").value = book.author || "";
                document.getElementById("product-category").value = book.category || "";
                document.getElementById("product-description").value = book.description || "";
                document.getElementById("product-date").value = book.published_date || "";

                // Input file KHÔNG thể gán giá trị bằng code (trình duyệt chặn),
                // nên chỉ xóa file đã chọn và hiện gợi ý về file đang dùng.
                document.getElementById("product-file").value = "";
                document.getElementById("product-image").value = "";
                setHint(
                    "file-hint",
                    book.read_url
                        ? `Đang dùng file PDF hiện tại${book.pages ? ` (${book.pages} trang)` : ""}. Chọn file mới nếu muốn thay.`
                        : "Sách này chưa có file PDF. Hãy chọn file PDF."
                );
                setHint(
                    "image-hint",
                    book.thumbnail_url
                        ? "Đang dùng ảnh bìa hiện tại. Chọn ảnh mới nếu muốn thay."
                        : "Chưa có ảnh bìa."
                );

                // Ghi nhận id đang edit
                currentEditingId = productId;
                currentEditingBook = book;

                // Đổi tiêu đề và nút lưu
                document.getElementById("modalTitle").textContent = "Edit Book";
                document.getElementById("btn-save").textContent = "Update Book";

                // Bật Modal
                bookModal.show();
            }
        })
        .catch((error) => console.error("Lỗi lấy chi tiết sách:", error));
}

function setSaving(isSaving, label) {
    const btnSave = document.getElementById("btn-save");
    if (!btnSave) return;

    btnSave.disabled = isSaving;
    if (isSaving) {
        btnSave.textContent = label;
    } else {
        btnSave.textContent = currentEditingId ? "Update Book" : "Save changes";
    }
}

function initSaveEvent() {
    const btnSave = document.getElementById("btn-save");
    if (!btnSave) return;

    btnSave.addEventListener("click", (e) => {
        e.preventDefault();
        handleSave();
    });
}

async function handleSave() {
    const name = document.getElementById("product-name").value.trim();
    const author = document.getElementById("product-author").value.trim();
    const category = document.getElementById("product-category").value.trim();
    const description = document.getElementById("product-description").value.trim();
    const publishedDate = document.getElementById("product-date").value.trim();
    const pdfFile = document.getElementById("product-file").files[0];
    const coverFile = document.getElementById("product-image").files[0];

    // ---- Kiểm tra dữ liệu trước khi upload ----
    if (!name || !author || !category || !description || !publishedDate) {
        alert("Vui lòng điền đầy đủ các trường bắt buộc (*).");
        return;
    }
    if (!/^\d{2}-\d{2}-\d{4}$/.test(publishedDate)) {
        alert("Publish Date phải có dạng YYYY-MM-DD, ví dụ 2024-05-31.");
        return;
    }
    if (!currentEditingId && !pdfFile) {
        alert("Vui lòng chọn file PDF cho sách mới.");
        return;
    }
    if (pdfFile && pdfFile.size > MAX_PDF_MB * 1024 * 1024) {
        alert(`File PDF quá lớn (tối đa ${MAX_PDF_MB}MB).`);
        return;
    }
    if (coverFile && coverFile.size > MAX_IMAGE_MB * 1024 * 1024) {
        alert(`Ảnh bìa quá lớn (tối đa ${MAX_IMAGE_MB}MB).`);
        return;
    }

    const bookData = {
        name,
        author,
        category,
        description,
        published_date: publishedDate,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
        // ---- 1. Upload PDF (nếu có chọn file mới) ----
        let pdf = null;
        if (pdfFile) {
            setSaving(true, "Đang tải PDF lên...");
            pdf = await uploadFile("/upload/pdf", "file", pdfFile);
            bookData.read_url = pdf.url; // info.js đang đọc field này
            bookData.pdf_public_id = pdf.public_id;
            bookData.pages = pdf.pages ?? null;
        }

        // ---- 2. Upload ảnh bìa (nếu có chọn ảnh mới) ----
        if (coverFile) {
            setSaving(true, "Đang tải ảnh bìa lên...");
            const image = await uploadFile("/upload", "image", coverFile);
            bookData.thumbnail_url = image.url;
            bookData.thumbnail_public_id = image.public_id;
            bookData.thumbnail_source = "upload";
        } else if (pdf && (!currentEditingId || currentEditingBook?.thumbnail_source === "pdf")) {
            // Không chọn ảnh bìa -> lấy trang 1 của PDF làm bìa
            // (khi sửa sách: chỉ cập nhật lại nếu bìa cũ cũng là bìa tự lấy từ PDF)
            bookData.thumbnail_url = pdf.thumbnail_url;
            bookData.thumbnail_public_id = null;
            bookData.thumbnail_source = "pdf";
        }

        // ---- 3. Lưu thông tin sách vào Firestore ----
        setSaving(true, "Đang lưu...");
        if (currentEditingId) {
            await db.collection("Books").doc(currentEditingId).update(bookData);
            alert("Cập nhật sách thành công!");
        } 
        else {
            bookData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("Books").add(bookData);
            alert("Thêm sách mới thành công!");
        }

        bookModal.hide();
        loadProducts();
    } catch (err) {
        console.error("Lỗi lưu sách:", err);
        alert("Lỗi: " + err.message);
    } finally {
        setSaving(false);
    }
}

// Xóa Form
function resetForm() {
    const fields = [
        "product-name",
        "product-author",
        "product-category",
        "product-description",
        "product-date",
        "product-file",
        "product-image",
    ];
    fields.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = ""; // gán "" cho input file là hợp lệ (xóa file đã chọn)
    });

    setHint("file-hint", `PDF, tối đa ${MAX_PDF_MB}MB.`);
    setHint("image-hint", "Không bắt buộc. Nếu bỏ trống, ảnh bìa sẽ lấy từ trang 1 của PDF.");
}

// Lấy danh sách sản phẩm
function loadProducts() {
    const container = document.getElementById("products-container");
    if (!container) return;

    db.collection("Books").get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                container.innerHTML = "<p>Không có sách nào.</p>";
                return;
            }

            let html = "";
            querySnapshot.forEach((doc) => {
                const book = doc.data();
                const pdfInfo = book.read_url
                    ? book.pages ? `${escapeHtml(book.pages)} pages` : "Uploaded"
                    : '<span class="text-danger">Missing</span>';

                html += `
                    <div class="card mb-3">
                        <div class="row g-0">
                            <div class="col-md-2 d-flex justify-content-center align-items-center p-2">
                                <img src="${escapeHtml(book.thumbnail_url || PLACEHOLDER_IMG)}" class="img-fluid rounded" alt="">
                            </div>
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title">${escapeHtml(book.name || "N/A")}</h5>
                                    <p class="card-text mb-1"><b>Author:</b> ${escapeHtml(book.author || "N/A")}</p>
                                    <p class="card-text mb-1"><b>Category:</b> ${escapeHtml(book.category || "N/A")}</p>
                                    <p class="card-text mb-1"><b>Release Date:</b> ${escapeHtml(book.published_date || "N/A")}</p>
                                    <p class="card-text mb-1"><b>PDF:</b> ${pdfInfo}</p>
                                </div>
                            </div>
                            <div class="col-md-2 d-flex justify-content-center align-items-center">
                                <button class="btn btn-warning btn-edit" data-id="${escapeHtml(doc.id)}">
                                    <i class="fa-solid fa-pen"></i> Edit
                                </button>
                                <button class="btn btn-danger ms-2 btn-delete" data-id="${escapeHtml(doc.id)}">
                                    <i class="fa-solid fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        })
        .catch((err) => {
            console.error("Lỗi tải danh sách sách:", err);
            container.innerHTML = "<p class='text-danger'>Không tải được danh sách sách.</p>";
        });
}

// Xóa sản phẩm
// Lưu ý: hiện chỉ xóa document trong Firestore. File trên Cloudinary (pdf_public_id,
// thumbnail_public_id) vẫn còn. Muốn xóa luôn thì cần thêm endpoint DELETE ở backend
// KÈM xác thực admin, nếu không ai cũng gọi được để xóa file của bạn.
function deleteProduct(productId) {
    if (confirm("Bạn có chắc chắn muốn xóa sách này?")) {
        db.collection("Books").doc(productId).delete()
            .then(() => loadProducts())
            .catch((err) => console.error("Lỗi xóa sách:", err));
    }
}


console.log("MAX_PDF_MB =", MAX_PDF_MB);