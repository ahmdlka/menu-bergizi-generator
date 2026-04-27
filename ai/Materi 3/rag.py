import os
import tempfile
import chromadb
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

COLLECTION_NAME = "documents"

_model: SentenceTransformer | None = None
_client = None
_collection = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _get_collection():
    global _client, _collection
    if _client is None:
        chroma_path = os.getenv("CHROMA_PATH", "./chroma_db")
        _client = chromadb.PersistentClient(path=chroma_path)
        _collection = _client.get_or_create_collection(COLLECTION_NAME)
    return _collection


def has_documents() -> bool:
    return _get_collection().count() > 0


def process_pdf(file_bytes: bytes) -> int:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        pages = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.split_documents(pages)

        texts = [c.page_content for c in chunks if c.page_content.strip()]
        if not texts:
            return 0

        embeddings = _get_model().encode(texts).tolist()
        ids = [f"chunk_{abs(hash(text + str(i)))}" for i, text in enumerate(texts)]

        _get_collection().add(documents=texts, embeddings=embeddings, ids=ids)
        return len(texts)
    finally:
        os.unlink(tmp_path)


def retrieve(query: str, top_k: int = 3) -> str:
    collection = _get_collection()
    if collection.count() == 0:
        return ""

    query_embedding = _get_model().encode([query]).tolist()
    n = min(top_k, collection.count())
    results = collection.query(query_embeddings=query_embedding, n_results=n)

    chunks = results["documents"][0]
    return "\n\n".join(chunks)
