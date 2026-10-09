import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../config/aws.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';

dotenv.config();

// Memory storage for multer (buffers the file in memory)
const storage = multer.memoryStorage();

// Accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

// Middleware to upload buffered file to S3
export const uploadToS3 = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  if (!s3Client) {
    // Fallback if no AWS keys: generate a fake URL for local testing
    console.warn('AWS credentials missing, skipping actual S3 upload');
    req.file.s3Url = `https://via.placeholder.com/600?text=${encodeURIComponent(req.file.originalname)}`;
    return next();
  }

  const fileExtension = path.extname(req.file.originalname);
  const randomName = crypto.randomBytes(16).toString('hex');
  const fileName = `${randomName}${fileExtension}`;

  const bucketName = process.env.S3_BUCKET_NAME || 'borrowback-assets';

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
    // Note: To make public-read work, bucket must have ACLs enabled or public bucket policy
    // ACL: 'public-read' 
  });

  try {
    await s3Client.send(command);
    req.file.s3Url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
    next();
  } catch (error) {
    console.error('S3 Upload Error:', error);
    next(new Error('Failed to upload image to S3'));
  }
};
