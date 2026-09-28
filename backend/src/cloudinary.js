import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = (fileBuffer, originalFilename) => {
  return new Promise((resolve, reject) => {
    const filenameWithoutExt = path.basename(originalFilename, path.extname(originalFilename));
    const cleanFilename = filenameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniquePublicId = `${cleanFilename}_${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'askpdf_docs',
        public_id: uniquePublicId,
        resource_type: 'raw',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    return result;
  } catch (error) {
    console.error(`[Cloudinary Delete Error]:`, error.message);
  }
};

export default cloudinary;
