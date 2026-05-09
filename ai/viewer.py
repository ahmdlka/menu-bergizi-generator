import os
import math
import chromadb
import streamlit as st
from sentence_transformers import SentenceTransformer

CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")
PAGE_SIZE = 10

st.set_page_config(
    page_title="ChromaDB Viewer",
    page_icon="🗃️",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.markdown("""
<style>
    [data-testid="stSidebar"] { background-color: #0f1117; }
    [data-testid="stSidebar"] * { color: #e5e7eb !important; }
    .metric-card {
        background: #1e2130;
        border-radius: 10px;
        padding: 20px 24px;
        border-left: 4px solid #4f8ef7;
    }
    .metric-value { font-size: 2rem; font-weight: 700; color: #4f8ef7; }
    .metric-label { font-size: 0.85rem; color: #9ca3af; margin-top: 4px; }
    .chunk-card {
        background: #1e2130;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 10px;
        border: 1px solid #2d3148;
    }
    .chunk-id { font-size: 0.75rem; color: #6b7280; font-family: monospace; }
    .chunk-index { font-size: 0.8rem; font-weight: 600; color: #4f8ef7; margin-bottom: 6px; }
    .chunk-text { font-size: 0.9rem; color: #d1d5db; line-height: 1.6; }
    .distance-badge {
        display: inline-block;
        background: #1a3a5c;
        color: #60a5fa;
        border-radius: 6px;
        padding: 2px 10px;
        font-size: 0.8rem;
        font-weight: 600;
    }
    div[data-testid="stTabs"] button { font-weight: 500; }
    .stTextInput input { background: #1e2130 !important; border-color: #2d3148 !important; }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_client():
    return chromadb.PersistentClient(path=CHROMA_PATH)


@st.cache_resource
def get_model():
    return SentenceTransformer("all-MiniLM-L6-v2")


def list_collections(client):
    return [c.name for c in client.list_collections()]


# ── Sidebar ────────────────────────────────────────────────────────────────────

client = get_client()

with st.sidebar:
    st.markdown("## 🗃️ ChromaDB Viewer")
    st.divider()

    col_names = list_collections(client)
    if not col_names:
        st.warning("Tidak ada collection ditemukan.")
        st.stop()

    selected_col = st.selectbox("Collection", col_names, label_visibility="collapsed")
    collection = client.get_collection(selected_col)
    total = collection.count()

    st.markdown(f"**Total chunks:** `{total}`")
    st.divider()

    if st.button("🔄  Refresh", use_container_width=True):
        st.cache_resource.clear()
        st.rerun()


# ── Header ─────────────────────────────────────────────────────────────────────

st.markdown(f"# {selected_col}")

tab_overview, tab_browse, tab_search, tab_manage = st.tabs(
    ["📊 Overview", "📄 Browse", "🔍 Semantic Search", "⚙️ Manage"]
)


# ── Tab: Overview ──────────────────────────────────────────────────────────────

with tab_overview:
    st.markdown("### Stats")
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{total}</div>
            <div class="metric-label">Total Chunks</div>
        </div>""", unsafe_allow_html=True)
    with c2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{len(col_names)}</div>
            <div class="metric-label">Collections</div>
        </div>""", unsafe_allow_html=True)
    with c3:
        pages_info = math.ceil(total / PAGE_SIZE) if total else 0
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-value">{pages_info}</div>
            <div class="metric-label">Halaman Browse</div>
        </div>""", unsafe_allow_html=True)

    if total > 0:
        st.markdown("### Preview (5 chunk pertama)")
        sample = collection.get(limit=5)
        for i, (doc_id, doc) in enumerate(zip(sample["ids"], sample["documents"])):
            st.markdown(f"""
            <div class="chunk-card">
                <div class="chunk-index">Chunk {i+1}</div>
                <div class="chunk-id">{doc_id}</div>
                <div class="chunk-text" style="margin-top:8px">{doc}</div>
            </div>""", unsafe_allow_html=True)


# ── Tab: Browse ────────────────────────────────────────────────────────────────

with tab_browse:
    if total == 0:
        st.info("Collection kosong. Upload PDF terlebih dahulu.")
    else:
        all_data = collection.get()
        ids = all_data["ids"]
        docs = all_data["documents"]

        search_filter = st.text_input("Filter teks (opsional)", placeholder="Cari kata kunci...")

        if search_filter:
            pairs = [(i, d) for i, d in zip(ids, docs) if search_filter.lower() in d.lower()]
        else:
            pairs = list(zip(ids, docs))

        filtered_total = len(pairs)
        total_pages = max(1, math.ceil(filtered_total / PAGE_SIZE))

        col_info, col_page = st.columns([3, 1])
        with col_info:
            st.caption(f"{filtered_total} chunk ditemukan")
        with col_page:
            page = st.number_input("Halaman", min_value=1, max_value=total_pages, value=1, step=1)

        start = (page - 1) * PAGE_SIZE
        page_pairs = pairs[start : start + PAGE_SIZE]

        st.divider()
        for idx, (doc_id, doc) in enumerate(page_pairs, start=start + 1):
            st.markdown(f"""
            <div class="chunk-card">
                <div class="chunk-index">#{idx}</div>
                <div class="chunk-id">{doc_id}</div>
                <div class="chunk-text" style="margin-top:8px">{doc}</div>
            </div>""", unsafe_allow_html=True)

        st.caption(f"Halaman {page} / {total_pages}")


# ── Tab: Semantic Search ───────────────────────────────────────────────────────

with tab_search:
    st.markdown("### Cari chunk yang relevan secara semantik")
    query = st.text_input("Query", placeholder="Masukkan pertanyaan atau topik...")
    top_k = st.slider("Jumlah hasil", min_value=1, max_value=min(20, total) if total else 1, value=5)

    if st.button("Cari", type="primary", disabled=not query or total == 0):
        with st.spinner("Encoding query..."):
            model = get_model()
            embedding = model.encode([query]).tolist()

        results = collection.query(query_embeddings=embedding, n_results=top_k)
        result_ids = results["ids"][0]
        result_docs = results["documents"][0]
        result_distances = results["distances"][0]

        st.divider()
        st.markdown(f"**{len(result_ids)} hasil teratas untuk:** _{query}_")

        for rank, (doc_id, doc, dist) in enumerate(zip(result_ids, result_docs, result_distances), 1):
            similarity = round(1 - dist, 4) if dist <= 1 else round(1 / (1 + dist), 4)
            st.markdown(f"""
            <div class="chunk-card">
                <div class="chunk-index">#{rank} &nbsp; <span class="distance-badge">score {similarity:.4f}</span></div>
                <div class="chunk-id">{doc_id}</div>
                <div class="chunk-text" style="margin-top:8px">{doc}</div>
            </div>""", unsafe_allow_html=True)

    if total == 0:
        st.info("Collection kosong. Upload PDF terlebih dahulu.")


# ── Tab: Manage ────────────────────────────────────────────────────────────────

with tab_manage:
    st.markdown("### Hapus semua data")
    st.warning(f"Ini akan menghapus semua **{total}** chunk dari collection `{selected_col}`.")

    confirm = st.text_input("Ketik nama collection untuk konfirmasi", placeholder=selected_col)
    if st.button("🗑️  Hapus Semua Chunk", type="primary", disabled=confirm != selected_col):
        collection.delete(ids=collection.get()["ids"])
        st.cache_resource.clear()
        st.success("Semua chunk berhasil dihapus.")
        st.rerun()

    st.divider()
    st.markdown("### Hapus satu chunk berdasarkan ID")
    del_id = st.text_input("Chunk ID", placeholder="chunk_123456...")
    if st.button("Hapus Chunk", disabled=not del_id):
        try:
            collection.delete(ids=[del_id])
            st.success(f"Chunk `{del_id}` dihapus.")
            st.cache_resource.clear()
            st.rerun()
        except Exception as e:
            st.error(f"Gagal: {e}")
