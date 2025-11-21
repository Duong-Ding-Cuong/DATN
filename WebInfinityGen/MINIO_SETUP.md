# MinIO Setup Guide

## Cài đặt MinIO

### Option 1: Sử dụng Docker (Khuyến nghị)

```bash
# Pull MinIO image
docker pull minio/minio

# Chạy MinIO container
docker run -p 9000:9000 -p 9001:9001 ^
  --name minio ^
  -e "MINIO_ROOT_USER=minioadmin" ^
  -e "MINIO_ROOT_PASSWORD=minioadmin" ^
  -v D:/minio/data:/data ^
  minio/minio server /data --console-address ":9001"
```

### Option 2: Cài đặt trực tiếp trên Windows

1. Download MinIO từ: https://dl.min.io/server/minio/release/windows-amd64/minio.exe
2. Tạo thư mục cho data: `mkdir C:\minio\data`
3. Chạy MinIO:

```bash
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin
minio.exe server C:\minio\data --console-address ":9001"
```

## Truy cập MinIO

-   **API Endpoint**: http://localhost:9000
-   **Web Console**: http://localhost:9001
-   **Username**: minioadmin
-   **Password**: minioadmin

## Cấu hình trong Backend

File `.env` đã được cấu hình:

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=webinfinitygen-images
```

## Cấu trúc API

### Upload Image

```
POST /api/upload/image
Body: {
  "base64Data": "data:image/png;base64,iVBORw0KG...",
  "fileName": "optional-name.png"
}
Response: {
  "success": true,
  "data": {
    "url": "http://localhost:9000/webinfinitygen-images/image_123.png",
    "objectName": "image_123.png"
  }
}
```

### Delete Image

```
DELETE /api/upload/image/:objectName
Response: {
  "success": true,
  "message": "Xóa ảnh thành công"
}
```

## Kiểm tra hoạt động

1. Chạy MinIO (Docker hoặc standalone)
2. Chạy backend: `cd backend && npm start`
3. Backend sẽ tự động tạo bucket `webinfinitygen-images`
4. Test upload ảnh từ frontend

## Lưu ý

-   Bucket được set public read - ai cũng có thể xem ảnh qua URL
-   Để private images, cần dùng presigned URLs
-   MinIO tương thích với AWS S3 API
-   Có thể migrate sang AWS S3 sau này mà không cần thay đổi code nhiều

## Production Setup

Khi deploy production:

1. Thay đổi MINIO_ACCESS_KEY và MINIO_SECRET_KEY
2. Set MINIO_USE_SSL=true
3. Sử dụng domain riêng cho MinIO endpoint
4. Setup backup cho MinIO data
5. Cân nhắc sử dụng AWS S3, Cloudinary hoặc các cloud storage khác
