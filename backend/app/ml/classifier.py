import logging

import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification

from app.core.config import settings
from app.schemas import Top3Item

logger = logging.getLogger(__name__)

TOP_K = 3


class ImageClassifier:
    def __init__(self, model_id: str | None = None) -> None:
        self.model_id = model_id or settings.hf_model_id
        self.processor = AutoImageProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForImageClassification.from_pretrained(self.model_id)
        self.model.to("cpu")
        self.model.eval()
        logger.info("Loaded image classifier %s", self.model_id)

    @property
    def labels(self) -> list[str]:
        return [
            self._clean_label(label)
            for label in self.model.config.id2label.values()
        ]

    @torch.no_grad()
    def classify(self, image: Image.Image) -> list[Top3Item]:
        inputs = self.processor(images=image.convert("RGB"), return_tensors="pt")
        logits = self.model(**inputs).logits
        scores = torch.softmax(logits, dim=-1)[0]
        top_scores, top_indices = torch.topk(scores, k=min(TOP_K, scores.shape[-1]))

        return [
            Top3Item(
                label=self._clean_label(self.model.config.id2label[index]),
                score=score,
            )
            for score, index in zip(top_scores.tolist(), top_indices.tolist())
        ]

    @staticmethod
    def _clean_label(label: str) -> str:
        return label.replace("_", " ").strip().capitalize()
