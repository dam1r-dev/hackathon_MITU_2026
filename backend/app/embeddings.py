"""Text embeddings.

Primary: fastembed (ONNX, CPU) with a multilingual model, so Kazakh / Russian / English
profiles land close to each other. The model is downloaded once (about 220 MB, can take
minutes on a slow network) into FASTEMBED_CACHE_PATH.

Fallback: a hashing bag-of-words vector. It keeps the app running offline (same language
only, no cross-language similarity). Force it with EMBEDDER=hashing.
"""
import logging
import os
import re
import zlib
from pathlib import Path

import numpy as np

log = logging.getLogger("embeddings")

MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
CACHE_DIR = os.getenv(
    "FASTEMBED_CACHE_PATH", str(Path(__file__).resolve().parents[2] / ".cache" / "fastembed")
)
HASH_DIM = 512
_WORD = re.compile(r"\w+", re.UNICODE)


def _normalize(m: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(m, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return m / norms


class Embedder:
    def __init__(self) -> None:
        self.kind = "hashing"
        self._model = None
        self._cache: dict[str, np.ndarray] = {}
        if os.getenv("EMBEDDER", "fastembed") == "fastembed":
            try:
                from fastembed import TextEmbedding

                self._model = TextEmbedding(MODEL, cache_dir=CACHE_DIR)
                self.kind = f"fastembed:{MODEL}"
            except Exception as exc:  # no network, no cache, missing package
                log.warning("fastembed unavailable (%s). Falling back to hashing vectors.", exc)

    def _hash(self, text: str) -> np.ndarray:
        v = np.zeros(HASH_DIM, dtype=np.float32)
        for tok in _WORD.findall(text.lower()):
            v[zlib.crc32(tok.encode("utf-8")) % HASH_DIM] += 1.0
        return v

    def encode(self, texts: list[str]) -> np.ndarray:
        """Return an (n, d) matrix of unit vectors. Repeated texts are cached."""
        missing = [t for t in dict.fromkeys(texts) if t not in self._cache]
        if missing:
            if self._model is not None:
                vecs = np.array(list(self._model.embed(missing)), dtype=np.float32)
            else:
                vecs = np.array([self._hash(t) for t in missing], dtype=np.float32)
            vecs = _normalize(vecs)
            for t, v in zip(missing, vecs):
                self._cache[t] = v
            if len(self._cache) > 2000:  # keep memory bounded
                for k in list(self._cache)[:500]:
                    del self._cache[k]
        if not texts:
            return np.zeros((0, HASH_DIM), dtype=np.float32)
        return np.stack([self._cache[t] for t in texts])
