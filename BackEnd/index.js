// dotenv phải chạy đầu tiên để các file require bên dưới đọc được biến môi trường
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const { upload, uploadPdf, IMAGE_MAX_MB, PDF_MAX_MB } = require('./middleware/multer');
const {
  uploadToCloudinary,
  uploadPdfToCloudinary,
  getPdfThumbnailUrl,
} = require('./utils/cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File PDF thật luôn chứa "%PDF-" ở đầu file (spec cho phép có vài byte rác phía trước)
const looksLikePdf = (buffer) => buffer.subarray(0, 1024).includes('%PDF-');

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Upload ảnh bìa: field "image"
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Chưa có file ảnh nào được upload.' });
    }

    const result = await uploadToCloudinary(req.file.buffer);

    return res.status(200).json({
      message: 'Upload thành công',
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      message: 'Upload thất bại',
      error: error.message,
    });
  }
});

// Upload file PDF: field "file"
app.post('/upload/pdf', uploadPdf.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Chưa có file PDF nào được upload.' });
    }

    if (!looksLikePdf(req.file.buffer)) {
      return res.status(400).json({ message: 'File này không phải PDF hợp lệ.' });
    }

    const result = await uploadPdfToCloudinary(req.file.buffer);

    return res.status(200).json({
      message: 'Upload PDF thành công',
      url: result.secure_url,
      public_id: result.public_id,
      pages: result.pages ?? null,
      bytes: result.bytes,
      thumbnail_url: getPdfThumbnailUrl(result.public_id, 1),
    });
  } catch (error) {
    console.error('Upload PDF error:', error);
    return res.status(500).json({
      message: 'Upload PDF thất bại',
      error: error.message,
    });
  }
});

// Bắt lỗi của multer / file filter và trả JSON (mặc định Express trả HTML 500)
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const limitMB = req.path === '/upload/pdf' ? PDF_MAX_MB : IMAGE_MAX_MB;
    const messages = {
      LIMIT_FILE_SIZE: `File vượt quá dung lượng cho phép (tối đa ${limitMB}MB).`,
      LIMIT_UNEXPECTED_FILE: `Sai tên field upload (${err.field}).`,
    };
    return res.status(400).json({ message: messages[err.code] || `Lỗi upload: ${err.message}` });
  }

  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Lỗi server' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
