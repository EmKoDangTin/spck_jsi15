const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
const MAX_FIT_WIDTH = 900; // px, bề rộng tối đa khi "vừa khít" để không bị quá to trên màn hình lớn
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;

let pdfDoc = null;
let bookId = null;
let currentPage = 1;
let zoom = 1;
let isRendering = false;
let pendingPage = null;
let lastRenderedPage = null;

const el = {
    readerBox: document.getElementById("reader"),
    status: document.getElementById("status"),
    canvas: document.getElementById("pdf-canvas"),
    title: document.getElementById("book-title"),
    prev: document.getElementById("btn-prev"),
    next: document.getElementById("btn-next"),
    pageInput: document.getElementById("page-input"),
    pageTotal: document.getElementById("page-total"),
    zoomIn: document.getElementById("btn-zoom-in"),
    zoomOut: document.getElementById("btn-zoom-out"),
    zoomLabel: document.getElementById("zoom-label"),
};

document.addEventListener("DOMContentLoaded", init);

function showStatus(message, isError = false) {
    el.canvas.classList.add("d-none");
    el.status.classList.remove("d-none");
    // textContent (không phải innerHTML) để an toàn với nội dung lỗi bất kỳ
    el.status.textContent = message;
    el.status.className = `mt-5 ${isError ? "text-warning" : "text-white"}`;
}

function progressKey() {
    return `bookblue:lastpage:${bookId}`;
}

function loadSavedPage() {
    try {
        const saved = parseInt(localStorage.getItem(progressKey()), 10);
        return Number.isInteger(saved) && saved >= 1 ? saved : 1;
    } catch (err) {
        return 1;
    }
}

function savePage(pageNum) {
    try {
        localStorage.setItem(progressKey(), String(pageNum));
    } catch (err) {
        // localStorage có thể bị chặn (chế độ riêng tư), bỏ qua
    }
}

async function init() {
    bookId = new URLSearchParams(window.location.search).get("id");

    if (!bookId) {
        showStatus("Không tìm thấy ID sách.", true);
        return;
    }
    if (typeof db === "undefined") {
        showStatus("Chưa kết nối được Firebase.", true);
        return;
    }
    if (typeof pdfjsLib === "undefined") {
        showStatus("Không tải được thư viện đọc PDF (pdf.js). Kiểm tra kết nối mạng.", true);
        return;
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;

    let book;
    try {
        const doc = await db.collection("Books").doc(bookId).get();
        if (!doc.exists) {
            showStatus("Sách này không tồn tại hoặc đã bị xóa.", true);
            return;
        }
        book = doc.data();
    } catch (err) {
        console.error("Lỗi lấy sách:", err);
        showStatus(`Lỗi tải dữ liệu: ${err.message}`, true);
        return;
    }

    el.title.textContent = book.name || "Đọc sách";
    document.title = book.name ? `${book.name} - Đọc sách` : "Đọc sách";

    if (!book.read_url) {
        showStatus("Sách này chưa có file PDF.", true);
        return;
    }

    try {
        // isEvalSupported:false = biện pháp giảm nhẹ lỗ hổng CVE-2024-4367 của pdf.js bản cũ (< 4.2.67)
        pdfDoc = await pdfjsLib.getDocument({ url: book.read_url, isEvalSupported: false }).promise;
    } catch (err) {
        console.error("Lỗi mở PDF:", err);
        showStatus(
            "Không mở được file PDF. Nếu file mới upload, hãy kiểm tra Cloudinary đã cho phép phân phối PDF chưa " +
            "(Settings → Security → PDF and ZIP files delivery).",
            true
        );
        return;
    }

    el.pageTotal.textContent = pdfDoc.numPages;
    el.pageInput.max = pdfDoc.numPages;
    el.status.classList.add("d-none");
    el.canvas.classList.remove("d-none");

    bindControls();
    goToPage(loadSavedPage());
}

function bindControls() {
    el.prev.addEventListener("click", () => goToPage(currentPage - 1));
    el.next.addEventListener("click", () => goToPage(currentPage + 1));
    el.pageInput.addEventListener("change", () => goToPage(parseInt(el.pageInput.value, 10)));
    el.zoomIn.addEventListener("click", () => setZoom(zoom + ZOOM_STEP));
    el.zoomOut.addEventListener("click", () => setZoom(zoom - ZOOM_STEP));

    document.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT") return;
        if (e.key === "ArrowRight" || e.key === "PageDown") goToPage(currentPage + 1);
        if (e.key === "ArrowLeft" || e.key === "PageUp") goToPage(currentPage - 1);
    });

    // Vẽ lại khi đổi kích thước cửa sổ (chờ người dùng dừng kéo ~200ms)
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => queueRender(currentPage), 200);
    });
}

function setZoom(value) {
    zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
    el.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
    queueRender(currentPage);
}

function goToPage(num) {
    if (!pdfDoc || !Number.isInteger(num)) {
        el.pageInput.value = currentPage;
        return;
    }
    currentPage = Math.min(pdfDoc.numPages, Math.max(1, num));
    queueRender(currentPage);
}

// pdf.js không cho render 2 lần cùng lúc lên 1 canvas -> nếu đang vẽ thì xếp hàng trang mới nhất
function queueRender(num) {
    if (isRendering) {
        pendingPage = num;
        return;
    }
    renderPage(num);
}

async function renderPage(num) {
    isRendering = true;
    try {
        const page = await pdfDoc.getPage(num);

        const baseViewport = page.getViewport({ scale: 1 });
        const available = Math.min(el.readerBox.clientWidth - 16, MAX_FIT_WIDTH);
        const scale = (available / baseViewport.width) * zoom;
        const viewport = page.getViewport({ scale });

        // Vẽ theo devicePixelRatio để chữ không bị mờ trên màn hình retina
        const ratio = window.devicePixelRatio || 1;
        el.canvas.width = Math.floor(viewport.width * ratio);
        el.canvas.height = Math.floor(viewport.height * ratio);
        el.canvas.style.width = `${Math.floor(viewport.width)}px`;
        el.canvas.style.height = `${Math.floor(viewport.height)}px`;

        await page.render({
            canvasContext: el.canvas.getContext("2d"),
            viewport,
            transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null,
        }).promise;

        el.status.classList.add("d-none");
        el.canvas.classList.remove("d-none");

        updateUi(num);
        savePage(num);
        if (num !== lastRenderedPage) window.scrollTo({ top: 0 });
        lastRenderedPage = num;
    } catch (err) {
        console.error("Lỗi render trang:", err);
        showStatus(`Không hiển thị được trang ${num}: ${err.message}`, true);
    } finally {
        isRendering = false;
        if (pendingPage !== null) {
            const next = pendingPage;
            pendingPage = null;
            renderPage(next);
        }
    }
}

function updateUi(num) {
    el.pageInput.value = num;
    el.pageInput.disabled = false;
    el.prev.disabled = num <= 1;
    el.next.disabled = num >= pdfDoc.numPages;
    el.zoomIn.disabled = zoom >= ZOOM_MAX;
    el.zoomOut.disabled = zoom <= ZOOM_MIN;
}
