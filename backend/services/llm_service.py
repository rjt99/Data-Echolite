import os
from langchain_openai import ChatOpenAI
from config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, TEXT_MODEL, VISION_MODEL

_HEADERS = {
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "ClarityFromChaos"
}


def get_text_llm(streaming: bool = False, callbacks=None) -> ChatOpenAI:
    return ChatOpenAI(
        model=TEXT_MODEL,
        openai_api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
        streaming=streaming,
        callbacks=callbacks or [],
        default_headers=_HEADERS,
        temperature=0.1,
        max_tokens=4096,
    )


def get_vision_llm(streaming: bool = False, callbacks=None) -> ChatOpenAI:
    return ChatOpenAI(
        model=VISION_MODEL,
        openai_api_key=OPENROUTER_API_KEY,
        base_url=OPENROUTER_BASE_URL,
        streaming=streaming,
        callbacks=callbacks or [],
        default_headers=_HEADERS,
        temperature=0.1,
        max_tokens=2048,
    )


def simple_llm_call(prompt: str, system: str = "") -> str:
    """Synchronous non-streaming LLM call."""
    from langchain_core.messages import HumanMessage, SystemMessage
    llm = get_text_llm()
    messages = []
    if system:
        messages.append(SystemMessage(content=system))
    messages.append(HumanMessage(content=prompt))
    response = llm.invoke(messages)
    return response.content


def vision_llm_call(text_prompt: str, image_b64: str, mime_type: str = "image/png") -> str:
    """Call vision model with base64 image."""
    from langchain_core.messages import HumanMessage
    llm = get_vision_llm()
    message = HumanMessage(content=[
        {"type": "text", "text": text_prompt},
        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_b64}"}}
    ])
    response = llm.invoke([message])
    return response.content
