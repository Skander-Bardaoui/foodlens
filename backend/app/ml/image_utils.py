import io

from PIL import Image, UnidentifiedImageError

from app.core.config import settings

ALLOWED_FORMATS = {"JPEG", "PNG"}
BYTES_PER_MB = 1024 * 1024


class InvalidImageError(ValueError):
    pass


class ImageTooLargeError(ValueError):
    pass


def validate_image(file_bytes: bytes) -> Image.Image:
    max_bytes = settings.max_upload_mb * BYTES_PER_MB
    if len(file_bytes) > max_bytes:
        raise ImageTooLargeError(
            f"Image exceeds the {settings.max_upload_mb} MB upload limit"
        )

    try:
        with Image.open(io.BytesIO(file_bytes)) as probe:
            probe.verify()

        with Image.open(io.BytesIO(file_bytes)) as image:
            if image.format not in ALLOWED_FORMATS:
                raise InvalidImageError(
                    f"Unsupported image format: {image.format}. Only JPEG and PNG are allowed"
                )
            return image.convert("RGB")
    except (UnidentifiedImageError, OSError) as exc:
        raise InvalidImageError("Could not read image file") from exc
