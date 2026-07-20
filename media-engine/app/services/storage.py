import uuid
from app.config import settings

# Lazy-init boto3 client — only if R2 is configured
_s3_client = None


def _get_client():
    """Get or create the boto3 S3 client for Cloudflare R2."""
    global _s3_client
    if _s3_client is None:
        import boto3
        _s3_client = boto3.client(
            "s3",
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
        )
    return _s3_client


def is_configured() -> bool:
    """Check if R2 credentials are set."""
    return bool(settings.R2_ENDPOINT and settings.R2_ACCESS_KEY and settings.R2_SECRET_KEY)


def _generate_key(folder: str, ext: str = "webp") -> str:
    """Generate a unique object key for R2."""
    unique_id = uuid.uuid4().hex[:16]
    return f"gremio-estelar/{folder}/{unique_id}.{ext}"


def upload(buffer: bytes, folder: str, content_type: str = "image/webp") -> str:
    """
    Upload a buffer to Cloudflare R2.
    Returns the public URL of the uploaded object.

    Args:
        buffer: The file bytes to upload
        folder: Subfolder within the bucket (avatars, banners, posts, etc.)
        content_type: MIME type of the file

    Returns:
        Public URL string
    """
    if not is_configured():
        raise RuntimeError(
            "Cloudflare R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY, and R2_SECRET_KEY."
        )

    client = _get_client()
    key = _generate_key(folder)

    client.put_object(
        Bucket=settings.R2_BUCKET,
        Key=key,
        Body=buffer,
        ContentType=content_type,
        CacheControl="public, max-age=31536000, immutable",
    )

    # Return the public URL via R2 Public Development URL or Custom Domain
    return f"{settings.R2_PUBLIC_URL}/{key}"


def upload_with_metadata(buffer: bytes, folder: str, content_type: str = "image/webp",
                         metadata: dict | None = None) -> dict:
    """
    Upload a buffer to R2 with optional metadata.
    Returns a dict with url and key.
    """
    if not is_configured():
        raise RuntimeError("Cloudflare R2 is not configured.")

    client = _get_client()
    key = _generate_key(folder)

    put_kwargs = {
        "Bucket": settings.R2_BUCKET,
        "Key": key,
        "Body": buffer,
        "ContentType": content_type,
        "CacheControl": "public, max-age=31536000, immutable",
    }
    if metadata:
        put_kwargs["Metadata"] = metadata

    client.put_object(**put_kwargs)

    return {
        "url": f"{settings.R2_PUBLIC_URL}/{key}",
        "key": key,
    }
