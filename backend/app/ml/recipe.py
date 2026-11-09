import json
import logging
from typing import Protocol

import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.schemas import RecipeOut

logger = logging.getLogger(__name__)

LLM_TIMEOUT_SECONDS = 20.0
MAX_ATTEMPTS = 2

PROMPT_TEMPLATE = """\
You are a culinary assistant. Write a recipe for the dish "{label}".

Respond with ONLY a valid JSON object, with no markdown, code fences, or commentary.
Use exactly this shape:
{{"ingredients": ["<quantity> <ingredient>", "..."], "steps": ["<short step>", "..."]}}

Requirements:
- 6 to 12 ingredients. Every ingredient must include a quantity.
- 4 to 8 short steps, in cooking order.
"""


class RecipeGenerationError(Exception):
    """The recipe could not be generated."""


class LLMConfigurationError(RecipeGenerationError):
    """The configured LLM provider cannot be used."""


class LLMTimeoutError(RecipeGenerationError):
    """The LLM did not answer within the timeout."""


class LLMRateLimitError(RecipeGenerationError):
    """The LLM provider rejected the request with HTTP 429."""


class LLMNetworkError(RecipeGenerationError):
    """The LLM request failed at the network or protocol level."""


class LLMClient(Protocol):
    def complete(self, prompt: str) -> str:
        ...


class OpenAIChatClient:
    def __init__(self, api_key: str, model: str, base_url: str) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def complete(self, prompt: str) -> str:
        try:
            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "response_format": {"type": "json_object"},
                },
                timeout=httpx.Timeout(LLM_TIMEOUT_SECONDS),
            )
        except httpx.TimeoutException as exc:
            raise LLMTimeoutError("LLM request timed out") from exc
        except httpx.HTTPError as exc:
            raise LLMNetworkError("Could not reach the LLM provider") from exc

        if response.status_code == 429:
            raise LLMRateLimitError("LLM provider rate limit exceeded")

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise LLMNetworkError(
                f"LLM provider returned HTTP {response.status_code}"
            ) from exc

        try:
            content = response.json()["choices"][0]["message"]["content"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise LLMNetworkError("Malformed response from the LLM provider") from exc

        if not isinstance(content, str) or not content.strip():
            raise LLMNetworkError("Empty response from the LLM provider")

        return content


_PROVIDER_BASE_URLS = {
    "openai": "https://api.openai.com/v1",
}


def get_llm_client() -> LLMClient:
    provider = settings.llm_provider.lower()
    base_url = settings.llm_base_url or _PROVIDER_BASE_URLS.get(provider)
    if base_url is None:
        raise LLMConfigurationError(f"Unsupported LLM provider: {settings.llm_provider}")

    if settings.llm_api_key is None or not settings.llm_api_key.get_secret_value():
        raise LLMConfigurationError("LLM_API_KEY is not configured")

    return OpenAIChatClient(
        api_key=settings.llm_api_key.get_secret_value(),
        model=settings.llm_model,
        base_url=base_url,
    )


def generate_recipe(label: str) -> RecipeOut:
    client = get_llm_client()
    prompt = PROMPT_TEMPLATE.format(label=label)

    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        raw = client.complete(prompt)
        try:
            return _parse_recipe(raw)
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = exc
            logger.warning(
                "Invalid recipe response on attempt %d/%d: %s",
                attempt,
                MAX_ATTEMPTS,
                exc,
            )

    raise RecipeGenerationError(
        f"LLM returned an invalid recipe after {MAX_ATTEMPTS} attempts"
    ) from last_error


def _parse_recipe(raw: str) -> RecipeOut:
    return RecipeOut.model_validate(json.loads(_strip_markdown_fences(raw)))


def _strip_markdown_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = text[3:]
        if text[:4].lower() == "json":
            text = text[4:]
        text = text.rstrip()
        if text.endswith("```"):
            text = text[:-3]
    return text.strip()
