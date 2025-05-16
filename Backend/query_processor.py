from sentence_transformers import SentenceTransformer
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_community.vectorstores import FAISS

class QueryProcessor:
    def __init__(
        self,
        faiss_dir: str = r"E:\Final Year Project\TaxPK\Backend\faiss_db",
        embedding_model_path: str = r"E:\Final Year Project\TaxPK\Backend\models",
    ):
        """
        Handles query processing and context retrieval from vector DB
        
        Args:
            faiss_dir: Directory containing FAISS index
            embedding_model_path: Path to sentence transformer model
        """
        self.faiss_dir = faiss_dir
        self.embed_fn = SentenceTransformerEmbeddings(model_name=embedding_model_path)
        self.vectorstore = self._load_vectorstore()

    def _load_vectorstore(self) -> FAISS:
        """Load existing vector store"""
        return FAISS.load_local(
            self.faiss_dir,
            embeddings=self.embed_fn,
            allow_dangerous_deserialization=True
        )

    def get_relevant_context(self, query: str, k: int = 4) -> str:
        """
        Convert query to vector, find similar vectors in DB, return text context
        
        Args:
            query: User query
            k: Number of chunks to retrieve
            
        Returns:
            Concatenated relevant context as plain text
        """
        # The similarity_search handles query embedding internally
        docs = self.vectorstore.similarity_search(query, k=k)
        
        # Extract page_content from each document object
        return "\n".join(doc.page_content for doc in docs)