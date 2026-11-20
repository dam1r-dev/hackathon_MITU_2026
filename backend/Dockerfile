FROM python:3.12-slim
WORKDIR /srv
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
# Pre-download the embedding model into the image so the first request is fast.
# If the build machine is offline this step is skipped and the app falls back to hashing vectors.
ENV FASTEMBED_CACHE_PATH=/srv/.cache/fastembed
RUN python -c "from fastembed import TextEmbedding; TextEmbedding('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')" || true
COPY backend backend
COPY data data
ENV PROFILES_FILE=/srv/data/profiles.json
EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
