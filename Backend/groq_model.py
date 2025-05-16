from groq import Groq

class LLMClient:
    def __init__(self, api_key: str, model: str = "llama3-8b-8192"):  # Fixed: __init__ not _init_
        self.client = Groq(api_key=api_key)  # Changed groq to client for consistency
        self.model = model

    def generate(self, context: str, query: str, previous_chat: str) -> str:
        prompt = f"Context:\n{context}\n\nUser Query: {query}\nPrevious Chat: {previous_chat}"  # Added missing \n
        chat_completion = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
        )
        return chat_completion.choices[0].message.content