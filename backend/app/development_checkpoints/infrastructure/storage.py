from __future__ import annotations

import hashlib
import mimetypes
from pathlib import Path
from urllib.parse import quote

import boto3
from botocore.client import Config

from app.core.config import settings


class ObjectStorage:
    def __init__(self) -> None:
        self.local_root = Path(settings.LOCAL_STORAGE_PATH).resolve()
        self.local_root.mkdir(parents=True, exist_ok=True)
        self._s3 = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY_ID,
            aws_secret_access_key=settings.S3_SECRET_ACCESS_KEY,
            region_name=settings.S3_REGION,
            config=Config(signature_version="s3v4"),
        )

    def presign_upload(self, object_key: str, content_type: str) -> str:
        return self._s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": settings.S3_BUCKET_CHECKPOINTS, "Key": object_key, "ContentType": content_type},
            ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS,
        )

    def presign_download(self, object_key: str) -> str:
        local_path = self.local_root / object_key
        if local_path.exists():
            return f"/api/v1/storage/local-upload/{quote(object_key)}"
        return self._s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET_CHECKPOINTS, "Key": object_key},
            ExpiresIn=settings.S3_PRESIGN_EXPIRY_SECONDS,
        )

    def head_object(self, object_key: str) -> dict:
        local_path = self.local_root / object_key
        if local_path.exists():
            return {
                "ContentLength": local_path.stat().st_size,
                "ContentType": mimetypes.guess_type(str(local_path))[0] or "application/octet-stream",
            }
        try:
            return self._s3.head_object(Bucket=settings.S3_BUCKET_CHECKPOINTS, Key=object_key)
        except Exception:
            if not local_path.exists():
                raise
            return {
                "ContentLength": local_path.stat().st_size,
                "ContentType": mimetypes.guess_type(str(local_path))[0] or "application/octet-stream",
            }

    def verify_sha256(self, object_key: str, expected_sha256: str | None) -> bool:
        if expected_sha256 is None:
            return True
        local_path = self.local_root / object_key
        if local_path.exists():
            digest = hashlib.sha256(local_path.read_bytes()).hexdigest()
            return digest == expected_sha256
        return True

    def delete(self, object_key: str) -> None:
        try:
            self._s3.delete_object(Bucket=settings.S3_BUCKET_CHECKPOINTS, Key=object_key)
        except Exception:
            local_path = self.local_root / object_key
            if local_path.exists():
                local_path.unlink()

    def local_upload_url(self, object_key: str) -> str:
        return f"/api/v1/storage/local-upload/{quote(object_key)}"


object_storage = ObjectStorage()
