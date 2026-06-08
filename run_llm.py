
OPENROUTER_KEY = "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"

from langchain_openrouter import ChatOpenRouter

model = ChatOpenRouter(
    api_key = OPENROUTER_KEY,
    # model = "nvidia/nemotron-3-super-120b-a12b:free",     #### Long Step Reasoning, Multistep Planning.
    # model = "nvidia/nemotron-3-ultra-550b-a55b:free",
    # model = "poolside/laguna-m.1:free"                      #### Tool calling and Coding agents.
    model = "openai/gpt-oss-120b:free"                      #### OpenAI.

)

messages = [
    (
        "system",
        "You are a helpful assistant that reply to user.",
    ),
    (
        "human", 
        "Give a 2 line deep thought."
    ),
]

# ai_msg = model.invoke(messages)
# print("Result >>", ai_msg.content)


#### Streaming response
reasoning_messages = ""
final_content = ""

for event in model.stream(messages):
    # Stream content chunks (partial text)
    if hasattr(event, "content") and event.content:
        print("Content >>", event.content)

    # Stream reasoning tokens
    if isinstance(event.additional_kwargs, dict):
        token = event.additional_kwargs.get("reasoning_content")
        if token:
            reasoning_messages += token
            print("Reasoning Token >>", token)
            print("Reasoning Messages >>", reasoning_messages)

    # Stream metadata
    if hasattr(event, "response_metadata") and event.response_metadata:
        print("Metadata >>", event.response_metadata)

    # Capture the final assembled content
    if hasattr(event, "content") and event.content:
        final_content += event.content

print("\n--- Stream completed ---")
print("\nFinal Content >>", final_content)
print("\nFull Reasoning Messages >>", reasoning_messages)


print("\n\n--- Stream completed ---")


