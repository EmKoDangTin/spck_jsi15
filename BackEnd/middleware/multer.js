const multer = require('multer');
require('dotenv').config();

const MB = 1024 * 1024;

// Có thể chỉnh trong .env: PDF_MAX_MB=10
// (gói Cloudinary free có giới hạn dung lượng mỗi file, hãy chỉnh cho khớp với plan của bạn)
const IMAGE_MAX_MB = 5;
const PDF_MAX_MB = Number(process.env.PDF_MAX_MB) || 10;

const storage = multer.memoryStorage();

const badRequest = (message) => {
  const error = new Error(message);
  error.status = 400;
  return error;
};

const imageFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(badRequest('Chỉ chấp nhận file ảnh'));
  }

  cb(null, true);
};

const pdfFilter = (req, file, cb) => {
  // Một số máy Windows gửi mimetype rỗng cho PDF -> nhận thêm theo đuôi file.
  // Kiểm tra thật sự (magic bytes) được làm ở route sau khi nhận file.
  const isPdfLike =
    file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

  if (!isPdfLike) {
    return cb(badRequest('Chỉ chấp nhận file PDF'));
  }

  cb(null, true);
};

const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: IMAGE_MAX_MB * MB, files: 1 },
});

const uploadPdf = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: PDF_MAX_MB * MB, files: 1 },
});

module.exports = {
  upload: uploadImage, // giữ tên cũ để code cũ không vỡ
  uploadImage,
  uploadPdf,
  IMAGE_MAX_MB,
  PDF_MAX_MB,
};
