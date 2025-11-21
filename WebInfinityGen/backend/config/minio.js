const Minio = require('minio');

// Cấu hình MinIO client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'webinfinitygen-images';

// Tạo bucket nếu chưa tồn tại
const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`);
      
      // Set policy để public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`✅ Bucket policy set to public read`);
    } else {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists`);
    }
  } catch (err) {
    console.error('❌ Error creating bucket:', err);
  }
};

// Upload base64 image lên MinIO
const uploadBase64Image = async (base64Data, fileName) => {
  try {
    // Remove data URL prefix nếu có
    let base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
    base64String = base64String.replace(/^data:application\/json;base64,/, '');
    const buffer = Buffer.from(base64String, 'base64');
    
    // Detect mime type từ base64 header
    let contentType = 'image/png';
    if (base64Data.startsWith('data:')) {
      const match = base64Data.match(/data:([^;]+);/);
      if (match) contentType = match[1];
    }
    
    // Generate unique filename nếu không có
    let objectName = fileName || `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${contentType.split('/')[1]}`;
    
    // Upload lên MinIO
    const metadata = {
      'Content-Type': contentType,
      'Cache-Control': 'max-age=31536000'
    };
    
    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, metadata);
    
    // Tạo URL để truy cập
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const url = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
    
    console.log(`✅ File uploaded: ${objectName}`);
    return { url, objectName };
  } catch (err) {
    console.error('❌ Error uploading file:', err);
    throw err;
  }
};

// Xóa image từ MinIO
const deleteImage = async (objectName) => {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName);
    console.log(`✅ Image deleted: ${objectName}`);
    return true;
  } catch (err) {
    console.error('❌ Error deleting image:', err);
    throw err;
  }
};

// Upload JSON object lên MinIO
const uploadJsonObject = async (jsonData, fileName) => {
  try {
    // Convert JSON object to string
    const jsonString = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
    const buffer = Buffer.from(jsonString, 'utf-8');
    
    // Generate unique filename
    const objectName = fileName || `game_${Date.now()}.json`;
    
    // Upload lên MinIO
    const metadata = {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=31536000'
    };
    
    await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, metadata);
    
    // Tạo URL để truy cập
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const protocol = useSSL ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    const url = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${objectName}`;
    
    console.log(`✅ JSON uploaded: ${objectName}`);
    return { url, objectName };
  } catch (err) {
    console.error('❌ Error uploading JSON:', err);
    throw err;
  }
};

// Get presigned URL (cho private images)
const getPresignedUrl = async (objectName, expirySeconds = 7 * 24 * 60 * 60) => {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, expirySeconds);
    return url;
  } catch (err) {
    console.error('❌ Error getting presigned URL:', err);
    throw err;
  }
};

module.exports = {
  minioClient,
  BUCKET_NAME,
  ensureBucket,
  uploadBase64Image,
  uploadJsonObject,
  deleteImage,
  getPresignedUrl
};
