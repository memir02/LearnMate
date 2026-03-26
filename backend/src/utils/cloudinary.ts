import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => {
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: 'learnmate/homeworks',
      resource_type: isPdf ? 'raw' : 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
      transformation: isPdf ? undefined : [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece JPG, PNG ve PDF dosyaları yüklenebilir.'));
    }
  },
});

export const deleteFromCloudinary = async (publicId: string, resourceType: 'image' | 'raw' = 'image') => {
  return await cloudinary.v2.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary.v2;
