import faiss
from flask import Flask, json, request, jsonify, render_template, redirect, url_for, session, make_response
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from transformers import AutoModelForCausalLM, AutoTokenizer
from authlib.integrations.flask_client import OAuth
from datetime import UTC, datetime
from api_key import *
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

load_dotenv()

app.secret_key = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=True)
    profile_picture = db.Column(db.String(250), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))
    
    # One-to-many relationship: User -> Chats
    chats = db.relationship('Chat', backref='user', lazy=True)

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))

    # One-to-many relationship: Chat -> Messages
    messages = db.relationship('Message', backref='chat', lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
    sender = db.Column(db.String(20), nullable=False)  # 'user' or 'bot'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC))


# OAuth configuration
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET,
    server_metadata_uri='https://accounts.google.com/.well-known/openid-configuration',
    authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
    token_endpoint="https://oauth2.googleapis.com/token",
    jwks_uri="https://www.googleapis.com/oauth2/v3/certs",
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'}
)

# Load FAISS index and preprocessed chunks
# print("Loading FAISS index and chunks...")
index = faiss.read_index("vector_index.faiss")
with open("chunks.json", "r") as f:
    preprocessed_chunks = json.load(f)

# Load embedding model
# print("Loading embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Load GPT-Neo model and tokenizer
# print("Loading GPT-Neo model and tokenizer...")
model_name = "EleutherAI/gpt-neo-1.3B"
tokenizer = AutoTokenizer.from_pretrained(model_name, token=True)
tokenizer.pad_token = tokenizer.eos_token
model = AutoModelForCausalLM.from_pretrained(model_name, token=True)

def search_index(query, index, embedding_model, preprocessed_chunks, top_k=3):
    """
    Search the FAISS index for the top_k most relevant chunks.
    """
    query_embedding = embedding_model.encode([query], convert_to_tensor=True).numpy()
    distances, indices = index.search(np.array(query_embedding), top_k)
    results = [preprocessed_chunks[idx] for idx in indices[0]]
    return results

@app.route('/')
def home():
    if "user_id" not in session:
        return redirect("http://localhost:5173", code=302)
    return redirect("http://localhost:5173/chat", code=302)


@app.route('/logout')
def logout():
    session.pop("user_id", None)  # Remove user_id from session
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/login/google')
def login():
    redirect_uri = url_for('authorize', _external=True)
    return google.authorize_redirect(redirect_uri)


@app.route('/authorize/google')
def authorize():
    token = google.authorize_access_token()
    user_info = google.get('userinfo').json()
    
    # Check if user exists in the database or create a new one
    user = User.query.filter_by(email=user_info['email']).first()
    if not user:
        user = User(
            email=user_info['email'],
            name=user_info['name'],
            profile_picture=user_info.get('picture')
        )
        db.session.add(user)
        db.session.commit()
        
    # Check if the user has a default chat; if not, create one
    default_chat = Chat.query.filter_by(user_id=user.id, title="Chat 1").first()
    if not default_chat:
        new_chat = Chat(user_id=user.id, title="Chat 1")
        db.session.add(new_chat)
        db.session.commit()
    
    # Save user_id in session
    session['user_id'] = user.id
    return redirect("http://localhost:5173/chat")  # Redirect to the frontend's chat page


@app.route('/api/get_chats', methods=['GET'])
def get_chats():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session["user_id"]
    chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.created_at).all()
    
    chat_list = [{"id": chat.id, "title": chat.title, "created_at": chat.created_at} for chat in chats]
    return jsonify(chat_list)



@app.route('/api/user_info', methods=['GET'])
def get_user_info():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user = db.session.get(User, session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "name": user.name,
        "email": user.email,
        "profile_picture": user.profile_picture,
        "created_at": user.created_at
    })
    

@app.route('/api/update_chat_title', methods=['PUT'])
def update_chat_title():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    data = request.get_json()
    chat_id = data.get("chat_id")
    new_title = data.get("new_title")

    if not chat_id or not new_title:
        return jsonify({"error": "Chat ID and new title are required"}), 400

    # Query the chat
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()

    if not chat:
        return jsonify({"error": "Chat not found or unauthorized"}), 404

    # Update the chat title
    chat.title = new_title
    db.session.commit()

    return jsonify({"message": "Chat title updated successfully", "new_title": new_title})


    
@app.route('/api/new_chat', methods=['POST'])
def new_chat():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        user_id = session["user_id"]
        data = request.get_json()
        title = data.get("title", "New Chat")  # Default title
        
        # Create new chat
        new_chat = Chat(user_id=user_id, title=title)
        db.session.add(new_chat)
        db.session.commit()

        # Return the chat id and title
        return jsonify({
            "chat_id": new_chat.id,
            "title": new_chat.title,
            "created_at": new_chat.created_at
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error: {e}")
        return jsonify({"error": "Failed to create new chat"}), 500
    
    
@app.route('/api/delete_chat', methods=['DELETE'])
def delete_chat():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    data = request.get_json()
    chat_id = data.get("chat_id")

    if not chat_id:
        return jsonify({"error": "Chat ID is required"}), 400

    # Query to find the chat
    chat = Chat.query.filter_by(id=chat_id, user_id=user_id).first()

    if not chat:
        return jsonify({"error": "Chat not found or unauthorized"}), 404

    # Delete associated messages first to maintain database integrity
    Message.query.filter_by(chat_id=chat.id).delete()

    # Delete the chat
    db.session.delete(chat)
    db.session.commit()

    return jsonify({"message": "Chat deleted successfully"})


@app.route('/api/get_messages', methods=['GET'])
def get_messages():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    chat_id = request.args.get("chat_id")

    if not chat_id:
        return jsonify({"error": "Chat ID is required"}), 400

    try:
        messages = Message.query.filter_by(chat_id=chat_id).order_by(Message.created_at).all()
        messages_data = [
            {
                "id": message.id,
                "sender": message.sender,
                "content": message.content,
                "created_at": message.created_at
            }
            for message in messages
        ]

        return jsonify({"messages": messages_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/add_message', methods=['POST'])
def add_message():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    chat_id = data.get("chat_id")
    sender = data.get("sender")  # 'user'
    content = data.get("content")

    if not chat_id or not sender or not content:
        return jsonify({"error": "Invalid data"}), 400

    try:
        # Add user message to the database
        user_message = Message(
            chat_id=chat_id,
            sender=sender,
            content=content
        )
        db.session.add(user_message)
        db.session.commit()

        # Retrieve relevant context using FAISS
        retrieved_chunks = search_index(content, index, embedding_model, preprocessed_chunks)
        retrieved_context = " ".join(retrieved_chunks)

        # Construct a GPT-Neo prompt with the retrieved context
        gpt_prompt = f"Context: {retrieved_context}\nQuestion: {content}\nAnswer:"
        inputs = tokenizer(gpt_prompt, return_tensors="pt", max_length=256, truncation=True, padding=True)
        outputs = model.generate(
            inputs.input_ids,
            attention_mask=inputs.attention_mask,
            max_new_tokens=50,
            num_beams=3,
            early_stopping=True
        )
        model_response_content = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        # Add model's response to the database
        model_message = Message(
            chat_id=chat_id,
            sender="bot",
            content=model_response_content
        )
        db.session.add(model_message)
        db.session.commit()

        return jsonify({"model_response": model_response_content}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
