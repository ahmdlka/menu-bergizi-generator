import os
import tempfile
import chromadb
from typing import List, Dict, Any, Optional
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

COLLECTION_NAME = "documents"
RELEVANCE_THRESHOLD = 0.3  # Set lower to be safe initially

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


def process_pdf(file_bytes: bytes, source_name: str = "Unknown") -> int:
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        loader = PyPDFLoader(tmp_path)
        pages = loader.load()

        splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
        chunks = splitter.split_documents(pages)

        texts = [c.page_content for c in chunks if c.page_content.strip()]
        if not texts:
            return 0

        embeddings = _get_model().encode(texts).tolist()
        ids = [f"chunk_{abs(hash(text + str(i)))}" for i, text in enumerate(texts)]
        metadatas = [{"source": source_name} for _ in texts]

        _get_collection().add(documents=texts, embeddings=embeddings, ids=ids, metadatas=metadatas)
        return len(texts)
    finally:
        os.unlink(tmp_path)


def retrieve(query: str, top_k: int = 5) -> str:
    collection = _get_collection()
    if collection.count() == 0:
        return ""

    query_embedding = _get_model().encode([query]).tolist()
    n = min(top_k, collection.count())
    results = collection.query(query_embeddings=query_embedding, n_results=n)

    chunks = results["documents"][0]
    metadatas = results["metadatas"][0] if results["metadatas"] else [{}] * len(chunks)
    distances = results["distances"][0] if results["distances"] else [0.0] * len(chunks)
    
    formatted_results = []
    for doc, meta, dist in zip(chunks, metadatas, distances):
        # Score = 1 / (1 + distance) for L2
        score = 1 / (1 + dist)
        
        if score < RELEVANCE_THRESHOLD:
            continue
            
        safe_meta = meta if meta is not None else {}
        source = safe_meta.get("source", "Unknown")
        formatted_results.append(f"[Sumber: {source}] [Relevansi: {score:.2f}]: {doc}")
        
    if not formatted_results:
        return "Tidak ditemukan data yang cukup relevan di Panduan Gizi."
        
    return "\n\n".join(formatted_results)
