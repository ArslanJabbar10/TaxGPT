from groq import Groq

class LLMClient:
    def __init__(self, api_key: str, model: str = "llama3-8b-8192"):  
        self.client = Groq(api_key=api_key)  
        self.model = model

    def generate(self, context: str, query: str, previous_chat: str, file_attached_data: str) -> str:
        if file_attached_data == "":
            prompt = f"This is Context:\n{context}\n\nCurrent User Query (can be empty if only file is attached): {query}\nPrevious Chats with user, dont respond or answer to them, these are just for background, context: {previous_chat}"  # Added missing \n
        else:
            prompt = f"Data fetched from attached file:\n{file_attached_data}\n\nThis is Context:\n{context}\n\nCurrent User Query (can be empty if only file is attached): {query}\n\nPrevious Chats with user, dont respond or to them, these are just for background, context: {previous_chat}"
        chat_completion = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers tax-related queries in Pakistan. You will receive relevant context from FBR data. Sometimes, the context may be limited or missing — in such cases, respond politely and clearly. Previous user messages will be included, and occasionally, extracted data from attached PDFs or images may also be provided. If not, still respond helpfully and respectfully."},
                {"role": "user", "content": prompt}
            ],
        )
        return chat_completion.choices[0].message.content