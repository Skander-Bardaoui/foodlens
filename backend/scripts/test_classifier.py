"""Print the classifier's top 3 predictions for local image files.

Usage (inside the api container or from backend/):
    python scripts/test_classifier.py path/to/pizza.jpg path/to/sushi.jpg
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import settings  # noqa: E402
from app.ml.classifier import ImageClassifier  # noqa: E402
from app.ml.image_utils import InvalidImageError, ImageTooLargeError, validate_image  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("images", nargs="+", type=Path, help="Image files to classify")
    args = parser.parse_args()

    print(f"Model: {settings.hf_model_id}")
    classifier = ImageClassifier()

    exit_code = 0
    for path in args.images:
        try:
            image = validate_image(path.read_bytes())
        except (InvalidImageError, ImageTooLargeError, OSError) as exc:
            print(f"\n{path}: {exc}", file=sys.stderr)
            exit_code = 1
            continue

        print(f"\n{path}")
        for rank, item in enumerate(classifier.classify(image), start=1):
            print(f"  {rank}. {item.label:<30} {item.score:.4f}")

    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
