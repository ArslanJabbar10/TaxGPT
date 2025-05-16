import os
import json
from PyPDF2 import PdfReader

class PDFProcessor:
    def __init__(self, data_folder: str, metadata_file: str):
        self.data_folder = data_folder
        self.metadata_file = metadata_file

    def _load_processed_files(self) -> dict:
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, "r") as f:
                return json.load(f)
        return {}

    def _update_processed_files(self, fname: str, ts: float):
        data = self._load_processed_files()
        data[fname] = ts
        with open(self.metadata_file, "w") as f:
            json.dump(data, f)

    def get_new_files(self) -> list[str]:
        """
        Return list of newly added or modified PDF file paths.
        """
        seen = self._load_processed_files()
        new_files = []
        for fname in os.listdir(self.data_folder):
            if not fname.lower().endswith(".pdf"):
                continue
            path = os.path.join(self.data_folder, fname)
            mtime = os.path.getmtime(path)
            if fname not in seen or mtime > seen[fname]:
                new_files.append(path)
                self._update_processed_files(fname, mtime)
        return new_files

    def get_all_files(self) -> list[str]:
        """
        Return list of all PDF file paths in the data folder.
        """
        all_files = []
        for fname in os.listdir(self.data_folder):
            if fname.lower().endswith(".pdf"):
                all_files.append(os.path.join(self.data_folder, fname))
        return all_files

    def load_and_chunk(self, file_path: str) -> list[str]:
        """
        Load a PDF file and split its text into chunked sentences.
        """
        chunks = []
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            for page in reader.pages:
                text = page.extract_text() or ""
                chunks.extend(text.split('. '))
        return chunks


if __name__ == "__main__":
    # Standalone PDF processing and FAISS index building
    DATA_FOLDER = r"E:\Final Year Project\TaxPK\Backend\Data"
    METADATA_FILE = "processed_files.json"
    FAISS_DIR = r"E:\Final Year Project\TaxPK\Backend\faiss_db"
    EMBEDDING_MODEL_PATH = r"E:\Final Year Project\TaxPK\Backend\models"

    # Initialize PDF processor
    pdf_proc = PDFProcessor(DATA_FOLDER, METADATA_FILE)

    # Gather and chunk all PDFs
    all_files = pdf_proc.get_all_files()
    all_chunks = []
    for path in all_files:
        all_chunks.extend(pdf_proc.load_and_chunk(path))

    # Build embeddings and FAISS index
    from langchain_community.embeddings import SentenceTransformerEmbeddings
    from langchain_community.vectorstores import FAISS

    embed_fn = SentenceTransformerEmbeddings(model_name=EMBEDDING_MODEL_PATH)
    vs = FAISS.from_texts(texts=all_chunks, embedding=embed_fn)
    vs.save_local(FAISS_DIR)

    print(f"Built FAISS index with {len(all_chunks)} chunks at '{FAISS_DIR}'")
