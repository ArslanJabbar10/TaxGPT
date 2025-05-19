import uuid
import traceback
from flask import Flask, request, jsonify, redirect, url_for, session, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text
from authlib.integrations.flask_client import OAuth
from title_generation import ChatTitleBot
from query_processor import QueryProcessor
from image_pdf_processing import FileProcessing
from groq_model import LLMClient
from tokens_check import num_tokens_from_string, trim_text_to_token_limit
from datetime import datetime, timezone
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
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    
    # One-to-many relationship: User -> Chats
    chats = db.relationship('Chat', backref='user', lazy=True)

class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(120), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
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
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))


# OAuth configuration
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv("CLIENT_ID"),
    client_secret=os.getenv("CLIENT_SECRET"),
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
            profile_picture=user_info['picture']
        )
        db.session.add(user)
        db.session.commit()
        
    # Check for the latest chat
    latest_chat = (
        Chat.query.filter_by(user_id=user.id)
        .order_by(Chat.id.desc())
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

def resolve_uploaded_file_path(filename: str) -> str:
    """Converts public-facing /uploads/... path to real file system path."""
    # Remove the '/uploads/' prefix if it's there
    if filename.startswith('/uploads/'):
        filename = filename.replace('/uploads/', '', 1)
    return os.path.join(app.config['UPLOAD_FOLDER'], filename)


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
    print(user.profile_picture)
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

        if not chat_id or not user_message or not model_response:
            # app.logger.error("Missing required data.")
            return jsonify({"error": "Missing required data"}), 400

        # Combine user message and model response
        combined_text = f"{user_message}\n{model_response}"
        bot_title = ChatTitleBot()
        new_title = bot_title.run(combined_text)
       
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

@app.route('/api/add_model_response', methods=['POST'])
def add_model_response():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.get_json()
    text = data.get('text')
    chat_id = data.get('chat_id')

    if not text or not chat_id:
        return jsonify({"error": "Invalid data provided"}), 400

    try:
        # Create a new message
        new_message = Message(
            chat_id=chat_id,
            sender='model',  # Indicating the message is from the model
            content=text,
        )

        # Add to the database
        db.session.add(new_message)
        db.session.commit()

        return jsonify({"message": "Model response added successfully"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

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
        
        messages = Message.query.filter_by(
            chat_id=chat_id,
            sender='user'
        ).all()
        
        previous_chats_list = [msg.content for msg in messages]
        separator = "\n"
        previous_chat = separator.join(previous_chats_list)
        print(f"Previous chat{previous_chat}")
                
        contextFetch = QueryProcessor()
        context = contextFetch.get_relevant_context(content)

        print (f"This is context = {context}")
        
        file_attached_data = ""
        print (file_path)
        if file_path:
            correct_file_path = resolve_uploaded_file_path(file_path)
            img_pdf = FileProcessing()
            if file_path.endswith(".pdf") or file_path.endswith(".docx"):
                file_attached_data = img_pdf.extract_text_from_pdf(correct_file_path)
            elif file_path.endswith(".png") or file_path.endswith(".jpg") or file_path.endswith(".jpeg") or file_path.endswith(".PNG") or file_path.endswith(".JPG") or file_path.endswith(".JPEG"):
                file_attached_data = img_pdf.extract_text_from_image(correct_file_path)
            else:
                print("Unsupported file type!")
            MAX_TOTAL_TOKENS = 6000
            RESERVED_FOR_MODEL_RESPONSE = 500  # buffer for model output
            MAX_INPUT_TOKENS = MAX_TOTAL_TOKENS - RESERVED_FOR_MODEL_RESPONSE

            # Count tokens for parts you control
            context_tokens = num_tokens_from_string(context)
            content_tokens = num_tokens_from_string(content)
            previous_chat_tokens = num_tokens_from_string(previous_chat)

            used_tokens = context_tokens + content_tokens + previous_chat_tokens

            available_tokens_for_file_data = MAX_INPUT_TOKENS - used_tokens
            file_attached_data = trim_text_to_token_limit(file_attached_data, available_tokens_for_file_data)
        
        print(f"This is data fetched from attached file:\n{file_attached_data}")
        
        llm_client = LLMClient(api_key=os.getenv("GROQ_API"))
        model_response = llm_client.generate(context, content, previous_chat, file_attached_data)
        print(model_response)
        return jsonify({"model_response": model_response}), 200

    except Exception as e:
        print(f"Full error traceback: {traceback.format_exc()}")
        db.session.rollback()
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500
    

if __name__ == '__main__':
    app.run(debug=True)
