import tiktoken

encoding = tiktoken.get_encoding("cl100k_base")

def num_tokens_from_string(text: str) -> int:
    return len(encoding.encode(text))

def trim_text_to_token_limit(text: str, token_limit: int) -> str:
    tokens = encoding.encode(text)
    if len(tokens) <= token_limit:
        return text
    trimmed_tokens = tokens[:token_limit]
    return encoding.decode(trimmed_tokens)