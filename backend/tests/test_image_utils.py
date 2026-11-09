from io import BytesIO

import pytest
from PIL import Image

from app.ml import image_utils
from app.ml.image_utils import (
    ImageTooLargeError,
    InvalidImageError,
    validate_image,
)


def generated_image_bytes(fmt: str) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (32, 32), (10, 120, 90)).save(buffer, format=fmt)
    return buffer.getvalue()


@pytest.mark.parametrize("fmt", ["PNG", "JPEG"])
def test_valid_images_are_accepted_and_converted_to_rgb(fmt):
    image = validate_image(generated_image_bytes(fmt))

    assert image.mode == "RGB"


def test_non_image_bytes_are_rejected():
    with pytest.raises(InvalidImageError):
        validate_image(b"definitely not an image")


def test_unsupported_format_is_rejected():
    with pytest.raises(InvalidImageError):
        validate_image(generated_image_bytes("GIF"))


def test_upload_over_limit_is_rejected(monkeypatch):
    monkeypatch.setattr(image_utils.settings, "max_upload_mb", 0)

    with pytest.raises(ImageTooLargeError):
        validate_image(generated_image_bytes("PNG"))
