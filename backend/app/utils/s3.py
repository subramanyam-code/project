import boto3, uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from loguru import logger
from app.core.config import settings


def upload_file_to_s3(file: UploadFile, folder: str = "uploads") -> str:
    if not settings.AWS_S3_BUCKET:
        raise HTTPException(status_code=503, detail="File storage not configured")
    ext = Path(file.filename).suffix.lower().lstrip(".")
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type .{ext} not allowed")
    file.file.seek(0, 2)
    size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail=f"File too large (max {settings.MAX_FILE_SIZE_MB}MB)")
    key = f"{folder}/{uuid.uuid4()}.{ext}"
    try:
        s3 = boto3.client("s3", aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                          aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY, region_name=settings.AWS_REGION)
        s3.upload_fileobj(file.file, settings.AWS_S3_BUCKET, key,
                          ExtraArgs={"ContentType": file.content_type or "application/octet-stream"})
        return f"https://{settings.AWS_S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
    except Exception as e:
        logger.error(f"S3 upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
