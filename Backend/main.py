import uuid
import faiss
from flask import Flask, json, request, jsonify, render_template, redirect, url_for, session, make_response, send_from_directory
from flask_cors import CORS
# from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import numpy as np
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from transformers import AutoModelForCausalLM, AutoTokenizer
from authlib.integrations.flask_client import OAuth
from datetime import UTC, datetime
from api_key import *
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

load_dotenv()

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'docx', 'pptx', 'txt'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = os.getenv("SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
# migrate = Migrate(app, db)


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
    hash_id = db.Column(db.String(36), default=lambda: str(uuid.uuid4()))  

    # One-to-many relationship: Chat -> Messages
    messages = db.relationship('Message', backref='chat', lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
    sender = db.Column(db.String(20), nullable=False)  # 'user' or 'bot'
    content = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(250), nullable=True)  # For file storage
    file_type = db.Column(db.String(50), nullable=True)   # For file type (e.g., 'image/png')
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
        
    # Check for the latest chat
    latest_chat = (
        Chat.query.filter_by(user_id=user.id)
        .order_by(Chat.created_at.desc())
        .first()
    )

    # If no chats exist, create a new one
    if not latest_chat:
        latest_chat = Chat(user_id=user.id, title="New Chat")
        db.session.add(latest_chat)
        db.session.commit()

    # Save user_id in session
    session['user_id'] = user.id

    # Redirect to the latest chat
    return redirect(f"http://localhost:5173/chat/{latest_chat.hash_id}")  # Redirect to the frontend's chat page


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload_file', methods=['POST'])
def upload_file():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)  # Sanitize filename
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))  # Save the file

        file_path = f"/uploads/{filename}"  # File path for frontend
        file_type = file.content_type  # e.g., 'image/png', 'application/pdf'

        return jsonify({"file_path": file_path, "file_type": file_type}), 200

    return jsonify({"error": "Invalid file type"}), 400


@app.route('/uploads/<path:filename>', methods=['GET'])
def serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/api/get_chats', methods=['GET'])
def get_chats():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session["user_id"]
    chats = Chat.query.filter_by(user_id=user_id).order_by(Chat.created_at).all()
    
    chat_list = [{"id": chat.id, "title": chat.title, "created_at": chat.created_at.isoformat(), "hash_id": chat.hash_id} for chat in chats]
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
        "created_at": user.created_at.isoformat()
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
            "hash_id": new_chat.hash_id,
            "title": new_chat.title,
            "created_at": new_chat.created_at.isoformat()
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
                "file_path": message.file_path,  # Include file path
                "file_type": message.file_type,
                "created_at": message.created_at.isoformat(),
            }
            for message in messages
        ]
        
        return jsonify({"messages": messages_data}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@app.route('/api/generate_title', methods=['POST'])
def generate_title():
    try:
        if "user_id" not in session:
            # app.logger.error("Unauthorized access attempt.")
            return jsonify({"error": "Unauthorized"}), 401

        data = request.get_json()
        chat_id = data.get("chat_id")
        user_message = data.get("user_message")
        model_response = data.get("model_response")
        
        # from here

        # Log inputs for debugging
        # app.logger.debug(f"Chat ID: {chat_id}, User Message: {user_message}, Model Response: {model_response}")

        if not chat_id or not user_message or not model_response:
            # app.logger.error("Missing required data.")
            return jsonify({"error": "Missing required data"}), 400

        # Combine user message and model response
        combined_text = f"User: {user_message}\nModel: {model_response}"
        input_text = f"generate a title: {combined_text}"

        # Log input to model
        # app.logger.debug(f"Input text for T5 model: {input_text}")

        # Tokenize with attention mask
        inputs = tokenizer(input_text, return_tensors="pt", truncation=True, padding=True)

        # Generate a title using the T5 model
        outputs = model.generate(
            inputs.input_ids,
            attention_mask=inputs.attention_mask,  # Include attention mask
            max_new_tokens=15,  # Use max_new_tokens instead of max_length
            num_beams=4,
            early_stopping=True,
            pad_token_id=tokenizer.eos_token_id,  # Explicitly set pad token
        )
        new_title = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()


        # till here

        # Truncate the title to fit the database column
        max_title_length = 120
        if len(new_title) > max_title_length:
            new_title = new_title[:max_title_length]

        # Log generated title
        # app.logger.debug(f"Generated title (truncated): {new_title}")

        # Update the chat title in the database
        chat = Chat.query.filter_by(id=chat_id, user_id=session["user_id"]).first()
        if chat:
            chat.title = new_title
            db.session.commit()
            return jsonify({"new_title": new_title}), 200
        else:
            # app.logger.error("Chat not found or unauthorized.")
            return jsonify({"error": "Chat not found"}), 404

    except Exception as e:
        # app.logger.error(f"Error in generate_title: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/add_message', methods=['POST'])
def add_message():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    chat_id = data.get("chat_id")
    sender = data.get("sender")  # 'user'
    content = data.get("content")
    file_path = data.get("file_path")  
    file_type = data.get("file_type") 
    
    print(f"send - {file_path}")
    print(f"send - {file_type}")
    
    if not chat_id or not sender or (not content and not file_path):
        return jsonify({"error": "Invalid data"}), 400

    try:
        # Add user message to the database
        user_message = Message(
            chat_id=chat_id,
            sender=sender,
            content=content or "",  # Use empty string if content is None
            file_path=file_path,    # Save the file name as file_path
            file_type=file_type,
        )
        db.session.add(user_message)
        db.session.commit()

        ##Retrieve relevant context using FAISS
        # retrieved_chunks = search_index(content, index, embedding_model, preprocessed_chunks)
        # retrieved_context = " ".join(retrieved_chunks)

        # # Construct a GPT-Neo prompt with the retrieved context
        # gpt_prompt = f"Context: {retrieved_context}\nQuestion: {content}\nAnswer:"
        # inputs = tokenizer(gpt_prompt, return_tensors="pt", max_length=256, truncation=True, padding=True)
        # outputs = model.generate(
        #     inputs.input_ids,
        #     attention_mask=inputs.attention_mask,
        #     max_new_tokens=50,
        #     num_beams=3,
        #     early_stopping=True
        # )
        # model_response_content = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

        ##Add model's response to the database
        model_message = Message(
            chat_id=chat_id,
            sender="model",
            content="This is model response"
        )
        db.session.add(model_message)
        db.session.commit()

        return jsonify({"model_response": "This is model response"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    




if __name__ == '__main__':
    app.run(debug=True)
