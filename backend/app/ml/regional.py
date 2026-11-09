import logging
from dataclasses import dataclass

import torch
from huggingface_hub import hf_hub_download
from PIL import Image
from torchvision import models, transforms
from transformers import CLIPModel, CLIPProcessor

from app.core.config import settings
from app.schemas import Top3Item

logger = logging.getLogger(__name__)

SUPPORTED_DISHES = {
    "couscous": "Couscous",
    "mloukhiya": "Mloukhiya",
}

REGIONAL_PROMPTS = {
    "couscous": [
        "a plate of couscous with vegetables and meat",
        "a bowl of couscous",
        "North African couscous",
        "Tunisian couscous",
        "couscous with stew and vegetables",
    ],
    "mloukhiya": [
        "a bowl of Tunisian mloukhiya",
        "a bowl of dark green mloukhiya stew",
        "mloukhiya with bread",
        "Middle Eastern molokhia",
        "molokhia soup",
        "a bowl of jute leaf stew",
        "a rustic bowl of green stew",
        "a bowl of green soup with bread",
    ],
}

CONFUSER_PROMPTS = [
    "a bowl of green pea soup",
    "a bowl of smooth green pea soup",
    "pea soup with dumplings",
    "a bowl of bright green pea soup",
]

FOOD101_PROMPT_TEMPLATES = [
    "a photo of {}",
    "a close-up photo of {}",
    "{} on a plate",
    "a dish of {}",
    "{}",
]

REGIONAL_MIN_MODEL_SCORE = 0.10
CLIP_OVERRIDE_MARGIN = 0.002
CLIP_CONFUSER_MARGIN = 0.005
# CLIP cosine scores sit in a narrow band; this temperature turns their
# margins into a readable confidence without changing the ranking.
CLIP_CONFIDENCE_TEMPERATURE = 0.015
UNCERTAINTY_THRESHOLD = 0.40


@dataclass(frozen=True)
class RegionalPrediction:
    label: str
    confidence: float
    uncertain: bool
    top3: list[Top3Item]


def select_regional_candidate(
    *,
    regional_scores: dict[str, float],
    clip_scores: dict[str, float],
    food101_clip_score: float,
    confuser_clip_score: float,
) -> tuple[str, float] | None:
    candidates = [
        (label, clip_scores[label])
        for label, score in regional_scores.items()
        if label in SUPPORTED_DISHES and score >= REGIONAL_MIN_MODEL_SCORE
    ]
    if not candidates:
        return None

    label, score = max(candidates, key=lambda item: item[1])
    if score < food101_clip_score + CLIP_OVERRIDE_MARGIN:
        return None
    if score < confuser_clip_score + CLIP_CONFUSER_MARGIN:
        return None
    return label, score


def build_top3(
    *,
    chosen_label: str,
    chosen_score: float,
    food101_top3: list[Top3Item],
    food101_clip_scores: dict[str, float],
) -> list[Top3Item]:
    candidates: list[tuple[str, float]] = [(chosen_label, chosen_score)]
    seen = {chosen_label}

    for item in food101_top3:
        if item.label in seen or item.label not in food101_clip_scores:
            continue
        candidates.append((item.label, food101_clip_scores[item.label]))
        seen.add(item.label)
        if len(candidates) == 3:
            break

    scores = torch.tensor([score for _, score in candidates], dtype=torch.float32)
    probabilities = torch.softmax(scores / CLIP_CONFIDENCE_TEMPERATURE, dim=-1)
    ranked = sorted(
        zip(candidates, probabilities.tolist()),
        key=lambda pair: pair[1],
        reverse=True,
    )
    return [
        Top3Item(label=label, score=float(probability))
        for (label, _), probability in ranked
    ]


class RegionalRecognizer:
    def __init__(self, food101_labels: list[str]) -> None:
        checkpoint = self._load_checkpoint()
        self.classes = list(checkpoint["classes"])
        self.model = self._build_regional_model(checkpoint)
        self.transform = transforms.Compose(
            [
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    [0.485, 0.456, 0.406],
                    [0.229, 0.224, 0.225],
                ),
            ]
        )

        self.clip_processor = CLIPProcessor.from_pretrained(settings.clip_model_id)
        self.clip_model = CLIPModel.from_pretrained(settings.clip_model_id)
        self.clip_model.eval()

        self.food101_embeddings = self._food101_text_embeddings(food101_labels)
        self.regional_embeddings = {
            label: self._text_embeddings(prompts)
            for label, prompts in REGIONAL_PROMPTS.items()
        }
        self.confuser_embeddings = self._text_embeddings(CONFUSER_PROMPTS)
        logger.info("Loaded regional dish recognizer %s", settings.regional_model_id)

    def _build_regional_model(self, checkpoint: dict) -> torch.nn.Module:
        model = models.mobilenet_v3_small(weights=None)
        model.classifier[3] = torch.nn.Linear(
            model.classifier[3].in_features,
            len(checkpoint["classes"]),
        )
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()
        return model

    def _load_checkpoint(self) -> dict:
        checkpoint_path = hf_hub_download(
            repo_id=settings.regional_model_id,
            filename="tunisian_food_mnv3.pt",
        )
        return torch.load(checkpoint_path, map_location="cpu", weights_only=True)

    def recognize(
        self,
        image: Image.Image,
        food101_top3: list[Top3Item],
    ) -> RegionalPrediction | None:
        if not food101_top3:
            return None

        food101_label = food101_top3[0].label
        food101_text_embeddings = self.food101_embeddings.get(food101_label)
        if food101_text_embeddings is None:
            return None

        rgb_image = image.convert("RGB")
        regional_scores = self._regional_scores(rgb_image)
        if not any(
            regional_scores[label] >= REGIONAL_MIN_MODEL_SCORE
            for label in SUPPORTED_DISHES
        ):
            return None

        image_embedding = self._image_embedding(rgb_image)

        chosen = select_regional_candidate(
            regional_scores=regional_scores,
            clip_scores={
                label: self._clip_score(
                    image_embedding,
                    self.regional_embeddings[label],
                )
                for label in SUPPORTED_DISHES
            },
            food101_clip_score=self._clip_score(
                image_embedding,
                food101_text_embeddings,
            ),
            confuser_clip_score=self._clip_score(
                image_embedding,
                self.confuser_embeddings,
            ),
        )
        if chosen is None:
            return None

        label, clip_score = chosen
        top3 = build_top3(
            chosen_label=SUPPORTED_DISHES[label],
            chosen_score=clip_score,
            food101_top3=food101_top3,
            food101_clip_scores={
                item.label: self._clip_score(
                    image_embedding,
                    self.food101_embeddings[item.label],
                )
                for item in food101_top3
                if item.label in self.food101_embeddings
            },
        )
        if top3[0].label != SUPPORTED_DISHES[label]:
            return None

        confidence = top3[0].score
        if confidence < UNCERTAINTY_THRESHOLD:
            return None

        logger.info("Regional dish override: %s (%.3f)", top3[0].label, confidence)
        return RegionalPrediction(
            label=top3[0].label,
            confidence=confidence,
            uncertain=False,
            top3=top3,
        )

    def _regional_scores(self, image: Image.Image) -> dict[str, float]:
        tensor = self.transform(image).unsqueeze(0)
        with torch.inference_mode():
            probabilities = torch.softmax(self.model(tensor)[0], dim=-1)
        return {
            label: float(probabilities[index])
            for index, label in enumerate(self.classes)
        }

    def _food101_text_embeddings(
        self,
        labels: list[str],
    ) -> dict[str, torch.Tensor]:
        prompts: list[str] = []
        prompt_labels: list[str] = []
        for label in labels:
            for template in FOOD101_PROMPT_TEMPLATES:
                prompts.append(template.format(label))
                prompt_labels.append(label)

        embeddings = self._text_embeddings(prompts)
        indices: dict[str, list[int]] = {}
        for index, label in enumerate(prompt_labels):
            indices.setdefault(label, []).append(index)
        return {
            label: embeddings[torch.tensor(label_indices)]
            for label, label_indices in indices.items()
        }

    def _text_embeddings(self, prompts: list[str]) -> torch.Tensor:
        inputs = self.clip_processor(
            text=prompts,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )
        with torch.inference_mode():
            embeddings = self.clip_model.get_text_features(**inputs)
        return embeddings / embeddings.norm(dim=-1, keepdim=True)

    def _image_embedding(self, image: Image.Image) -> torch.Tensor:
        inputs = self.clip_processor(images=image, return_tensors="pt")
        with torch.inference_mode():
            embedding = self.clip_model.get_image_features(**inputs)[0]
        return embedding / embedding.norm()

    @staticmethod
    def _clip_score(
        image_embedding: torch.Tensor,
        text_embeddings: torch.Tensor,
    ) -> float:
        similarities = image_embedding @ text_embeddings.T
        top = torch.topk(
            similarities,
            k=min(2, similarities.shape[-1]),
        ).values
        return float(top.mean())
