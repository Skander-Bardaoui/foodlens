import json

import httpx
import pytest
from pydantic import SecretStr

from app.ml import recipe as recipe_module
from app.ml.recipe import (
    LLMConfigurationError,
    LLMNetworkError,
    LLMRateLimitError,
    LLMTimeoutError,
    RecipeGenerationError,
    generate_recipe,
)
from app.schemas import RecipeOut

VALID_RECIPE = {
    "ingredients": [
        "500 g pizza dough",
        "200 g crushed tomatoes",
        "250 g fresh mozzarella",
        "1 handful fresh basil",
        "2 tbsp olive oil",
        "1 tsp salt",
    ],
    "steps": [
        "Heat the oven to 250 C.",
        "Stretch the dough on a floured tray.",
        "Spread tomatoes and add mozzarella.",
        "Bake for about 10 minutes.",
        "Finish with basil and olive oil.",
    ],
}


@pytest.fixture(autouse=True)
def configured_llm(monkeypatch):
    monkeypatch.setattr(recipe_module.settings, "llm_provider", "groq")
    monkeypatch.setattr(recipe_module.settings, "llm_model", "openai/gpt-oss-120b")
    monkeypatch.setattr(recipe_module.settings, "llm_api_key", SecretStr("test-key"))
    monkeypatch.setattr(recipe_module.settings, "llm_base_url", None)


def chat_response(content: str, status_code: int = 200) -> httpx.Response:
    return httpx.Response(
        status_code,
        json={"choices": [{"message": {"content": content}}]},
        request=httpx.Request(
            "POST", "https://api.groq.com/openai/v1/chat/completions"
        ),
    )


def install_http_responses(monkeypatch, outcomes: list) -> list[dict]:
    calls: list[dict] = []

    def fake_post(url: str, **kwargs) -> httpx.Response:
        calls.append({"url": url, **kwargs})
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    monkeypatch.setattr(recipe_module.httpx, "post", fake_post)
    return calls


def test_generate_recipe_returns_validated_recipe(monkeypatch):
    calls = install_http_responses(
        monkeypatch, [chat_response(json.dumps(VALID_RECIPE))]
    )

    recipe = generate_recipe("Margherita pizza")

    assert isinstance(recipe, RecipeOut)
    assert recipe.ingredients == VALID_RECIPE["ingredients"]
    assert recipe.steps == VALID_RECIPE["steps"]
    assert len(calls) == 1
    assert calls[0]["url"] == "https://api.groq.com/openai/v1/chat/completions"
    assert calls[0]["json"]["model"] == "openai/gpt-oss-120b"
    assert "Margherita pizza" in calls[0]["json"]["messages"][0]["content"]
    assert calls[0]["timeout"].read == 20.0


def test_custom_llm_base_url_is_used(monkeypatch):
    monkeypatch.setattr(
        recipe_module.settings, "llm_base_url", "http://localhost:9010/v1"
    )
    calls = install_http_responses(
        monkeypatch, [chat_response(json.dumps(VALID_RECIPE))]
    )

    generate_recipe("Margherita pizza")

    assert calls[0]["url"] == "http://localhost:9010/v1/chat/completions"


def test_markdown_fences_are_stripped(monkeypatch):
    fenced = f"```json\n{json.dumps(VALID_RECIPE)}\n```"
    install_http_responses(monkeypatch, [chat_response(fenced)])

    recipe = generate_recipe("Margherita pizza")

    assert recipe.ingredients == VALID_RECIPE["ingredients"]


def test_invalid_json_is_retried_once(monkeypatch):
    calls = install_http_responses(
        monkeypatch,
        [chat_response("not json"), chat_response(json.dumps(VALID_RECIPE))],
    )

    recipe = generate_recipe("Margherita pizza")

    assert recipe.steps == VALID_RECIPE["steps"]
    assert len(calls) == 2


def test_invalid_json_twice_raises_generation_error(monkeypatch):
    calls = install_http_responses(
        monkeypatch,
        [chat_response("nope"), chat_response('{"ingredients": "wrong shape"}')],
    )

    with pytest.raises(RecipeGenerationError):
        generate_recipe("Margherita pizza")

    assert len(calls) == 2


def test_timeout_raises_clean_error(monkeypatch):
    calls = install_http_responses(
        monkeypatch, [httpx.ReadTimeout("LLM took too long")]
    )

    with pytest.raises(LLMTimeoutError):
        generate_recipe("Margherita pizza")

    assert len(calls) == 1


def test_rate_limit_raises_clean_error(monkeypatch):
    install_http_responses(monkeypatch, [chat_response("{}", status_code=429)])

    with pytest.raises(LLMRateLimitError):
        generate_recipe("Margherita pizza")


def test_network_error_raises_clean_error(monkeypatch):
    install_http_responses(
        monkeypatch, [httpx.ConnectError("connection refused")]
    )

    with pytest.raises(LLMNetworkError):
        generate_recipe("Margherita pizza")


def test_missing_api_key_raises_configuration_error(monkeypatch):
    monkeypatch.setattr(recipe_module.settings, "llm_api_key", None)

    with pytest.raises(LLMConfigurationError):
        generate_recipe("Margherita pizza")
