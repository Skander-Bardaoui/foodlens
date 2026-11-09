import io
import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Request, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.repository import create_analysis, to_out
from app.db.session import get_db
from app.ml.image_utils import ImageTooLargeError, InvalidImageError, validate_image
from app.ml.recipe import RecipeGenerationError, generate_recipe
from app.schemas import AnalysisOut, ErrorResponse, RecipeOut

logger = logging.getLogger(__name__)

UNCERTAINTY_THRESHOLD = 0.40

router = APIRouter(prefix="/api")


@router.post(
    "/analyze",
    response_model=AnalysisOut,
    summary="Analyze a food photo",
    description=(
        "Upload a JPEG or PNG photo of a dish. The image is classified with "
        "Food-101 and the regional dish catalog (couscous, mloukhiya), a recipe "
        "is generated for confident predictions, and the analysis is persisted."
    ),
    responses={
        400: {"model": ErrorResponse, "description": "The upload is not a valid image"},
        413: {"model": ErrorResponse, "description": "The upload exceeds MAX_UPLOAD_MB"},
        422: {"model": ErrorResponse, "description": "Validation error"},
        429: {"model": ErrorResponse, "description": "Analyze rate limit exceeded"},
        502: {"model": ErrorResponse, "description": "Recipe generation failed"},
    },
)
def analyze_image(
    request: Request,
    image: UploadFile = File(..., description="JPEG or PNG image of a dish"),
    db: Session = Depends(get_db),
):
    file_bytes = image.file.read()

    try:
        pil_image = validate_image(file_bytes)
    except ImageTooLargeError as exc:
        return _error(413, "IMAGE_TOO_LARGE", str(exc))
    except InvalidImageError as exc:
        return _error(400, "INVALID_IMAGE", str(exc))

    top3 = request.app.state.classifier.classify(pil_image)
    regional = getattr(request.app.state, "regional", None)
    regional_result = None
    if regional is not None:
        try:
            regional_result = regional.recognize(pil_image, top3)
        except Exception:
            logger.exception(
                "Regional recognition failed; falling back to the Food-101 result"
            )

    if regional_result is not None:
        label = regional_result.label
        confidence = regional_result.confidence
        uncertain = regional_result.uncertain
        top3 = regional_result.top3
    else:
        label = top3[0].label
        confidence = top3[0].score
        uncertain = confidence < UNCERTAINTY_THRESHOLD

    if uncertain:
        recipe = RecipeOut(ingredients=[], steps=[])
    else:
        try:
            recipe = generate_recipe(label)
        except RecipeGenerationError as exc:
            logger.warning("Recipe generation failed for %r: %s", label, exc)
            return _error(
                502, "LLM_FAILURE", "Could not generate a recipe. Please try again."
            )

    image_path = _store_image(file_bytes)

    record = create_analysis(
        db,
        {
            "label": label,
            "confidence": confidence,
            "uncertain": uncertain,
            "top3": [item.model_dump() for item in top3],
            "ingredients": recipe.ingredients,
            "steps": recipe.steps,
            "image_path": image_path,
        },
    )
    return to_out(record)


def _store_image(file_bytes: bytes) -> str:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{_image_suffix(file_bytes)}"
    image_path = upload_dir / filename
    image_path.write_bytes(file_bytes)
    return str(image_path)


def _image_suffix(file_bytes: bytes) -> str:
    with Image.open(io.BytesIO(file_bytes)) as image:
        return ".jpg" if image.format == "JPEG" else ".png"


def _error(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )
