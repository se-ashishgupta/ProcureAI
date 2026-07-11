"""LLM factory for the RFP agent."""

from __future__ import annotations

import os

from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel

DEFAULT_MODEL = "openai:gpt-4o-mini"


def get_model(
    model: str | None = None, temperature: float | None = None
) -> BaseChatModel:
    """Instantiate the configured chat model."""
    model_id = model or os.getenv("RFP_MODEL") or DEFAULT_MODEL
    temp = temperature if temperature is not None else float(os.getenv("RFP_TEMPERATURE", "0.2"))
    return init_chat_model(model_id, temperature=temp)
