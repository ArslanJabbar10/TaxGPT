import sys
from dotenv import load_dotenv
import os
load_dotenv()


try:
    import requests
except ImportError:
    sys.exit("Install requests: pip install requests")

class ChatTitleBot(object):
    """
    Reads a multi-line query, asks Groq for a 2–4 word title,
    and sets your terminal’s title bar accordingly.
    """

    API_URL = 'https://api.groq.com/openai/v1/chat/completions'
    API_KEY = os.getenv("GROQ_API")

    def get_chat_title(self, query):
        """
        Returns a 2–4 word title for `query`, or 'Untitled Chat' on error.
        """
        messages = [
            {"role": "system", "content":
             "Generate exactly a 2–4 word chat title summarizing the user’s query. ONLY return the title."},
            {"role": "user", "content": query}
        ]
        payload = {
            "model":       "llama-3.3-70b-versatile",
            "messages":    messages,
            "max_tokens":  8,
            "temperature": 0.3,
            "stop":       ["\n"]
        }
        headers = {
            "Authorization": f"Bearer {self.API_KEY}",
            "Content-Type":  "application/json"
        }

        try:
            resp = requests.post(self.API_URL, headers=headers, json=payload, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            title = data["choices"][0]["message"]["content"].strip()
            return title or "Untitled Chat"
        except Exception as e:
            sys.stderr.write(f"⚠️ API error: {e}\n")
            return "Untitled Chat"

    def set_terminal_title(self, title):
        """
        ESC ] 0 ; title BEL  → works on most UNIX-style terminals
        """
        sys.stdout.write(f"\x1b]0;{title}\x07")
        sys.stdout.flush()

    def run(self, query):
        title = self.get_chat_title(query)
        self.set_terminal_title(title)
        return title

# if __name__ == "__main__":
#     ChatTitleBot().run()
