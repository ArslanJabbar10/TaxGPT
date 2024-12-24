import json
import fitz  # PyMuPDF
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.stem import WordNetLemmatizer
import nltk
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import os
import re


def extract_text_from_pdfs(pdf_folder_path):
    pdf_texts = []
    for file_name in os.listdir(pdf_folder_path):
        if file_name.endswith('.pdf'):
            pdf_path = os.path.join(pdf_folder_path, file_name)
            with fitz.open(pdf_path) as doc:
                text = ""
                for page in doc:
                    text += page.get_text()
                pdf_texts.append(text)
    return pdf_texts

# Example usage
pdf_folder_path = 'testingPDFs/'
pdf_texts = extract_text_from_pdfs(pdf_folder_path)



def preprocess_texts(pdf_texts, max_sentences_per_chunk=3):
    # Initialize tools
    stop_words = set(stopwords.words('english'))
    lemmatizer = WordNetLemmatizer()
    
    nltk.download('punkt_tab')

    chunks = []
    for text in pdf_texts:
        # Convert text to lowercase
        text = text.lower()
        
        # Remove unwanted patterns
        text = re.sub(r'\b[a-z]{1,3}\b', ' ', text)  # Remove short words like ii, ccd
        text = re.sub(r'\.\.+', ' ', text)  # Remove sequences of dots
        text = re.sub(r'\s+', ' ', text)  # Replace multiple spaces with a single space
        
        # Split text into sentences
        sentences = sent_tokenize(text)
        processed_sentences = []
        
        for sentence in sentences:
            # Remove stray characters and filter sentences
            sentence = re.sub(r'[^a-zA-Z\s]', '', sentence)  # Keep only letters and spaces
            
            # Tokenize sentence into words
            words = word_tokenize(sentence)
            
            # Remove stopwords and lemmatize words
            filtered_words = [
                lemmatizer.lemmatize(word) for word in words if word not in stop_words
            ]
            
            # Rejoin cleaned sentence
            processed_sentence = ' '.join(filtered_words)
            
            # Exclude empty or very short sentences
            if len(processed_sentence) > 3:
                processed_sentences.append(processed_sentence)
        
        # Group sentences into chunks
        chunk = []
        for i, sentence in enumerate(processed_sentences):
            chunk.append(sentence)
            # Create a new chunk after every `max_sentences_per_chunk` sentences
            if (i + 1) % max_sentences_per_chunk == 0 or i == len(processed_sentences) - 1:
                chunks.append('. '.join(chunk) + '.')
                chunk = []
    
    return chunks

# Preprocess the extracted texts
preprocessed_chunks = preprocess_texts(pdf_texts)

# Example: Print the cleaned and chunked data
# for chunk in preprocessed_chunks:
#     print(chunk)
#     print("---")

# Load pre-trained embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings for each chunk
embeddings = embedding_model.encode(preprocessed_chunks, convert_to_tensor=True)

# Assuming `embeddings` is a list or tensor of embeddings
# Convert embeddings to a numpy array (if not already)
embeddings_np = np.array([embedding.numpy() for embedding in embeddings], dtype='float32')

# Define the dimension of the embeddings
dimension = embeddings_np.shape[1]

# Create a FAISS index with L2 distance metric
index = faiss.IndexFlatL2(dimension)

# Add the embeddings to the FAISS index
index.add(embeddings_np)

# Save the index and chunks
with open("chunks.json", "w") as f:
    json.dump(preprocessed_chunks, f)

# Save the index to disk for later use
faiss.write_index(index, "vector_index.faiss")

print("FAISS index created and saved successfully.")
