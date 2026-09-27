const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  secure: true,
});

const assertConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_SECRET_KEY
  ) {
    const error = new Error(
      'Thiếu cấu hình Cloudinary. Hãy thêm CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_SECRET_KEY vào file .env'
    );
    error.code = 'CLOUDINARY_CONFIG_MISSING';
    throw error;
  }
};

// Hàm dùng chung: đẩy 1 buffer lên Cloudinary bằng upload_stream
const uploadBuffer = (buffer, options) => {
  assertConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });

    stream.end(buffer);
  });
};

// Ảnh bìa: giới hạn tối đa 1000x1500 để khỏi lưu ảnh gốc quá nặng
const uploadToCloudinary = (buffer) =>
  uploadBuffer(buffer, {
    folder: 'book_covers',
    resource_type: 'image',
    transformation: [{ width: 1000, height: 1500, crop: 'limit' }],
  });

// File PDF: upload với resource_type "image" để Cloudinary coi nó là tài liệu nhiều trang
// (trả về số trang `pages` và render được từng trang thành ảnh).
const uploadPdfToCloudinary = (buffer) =>
  uploadBuffer(buffer, {
    folder: 'book_pdfs',
    resource_type: 'image',
  });

// URL ảnh bìa lấy từ trang `page` của PDF (chỉ build chuỗi URL, không gọi mạng)
const getPdfThumbnailUrl = (publicId, page = 1) =>
  cloudinary.url(publicId, {
    secure: true,
    resource_type: 'image',
    type: 'upload',
    format: 'jpg',
    transformation: [{ page }, { width: 600, crop: 'limit' }, { quality: 'auto' }],
  });

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadPdfToCloudinary,
  getPdfThumbnailUrl,
};
