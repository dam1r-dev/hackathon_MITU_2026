"""2D layout and clusters for the room map. PCA on the embeddings plus a small k-means."""
import numpy as np


def layout(mat: np.ndarray, k: int = 6) -> tuple[np.ndarray, np.ndarray]:
    """Return (xy in [0.05, 0.95], cluster labels). Deterministic."""
    n = len(mat)
    if n == 0:
        return np.zeros((0, 2)), np.zeros(0, dtype=int)
    if n < 3:
        return np.full((n, 2), 0.5), np.zeros(n, dtype=int)

    centered = mat - mat.mean(axis=0)
    _, _, vt = np.linalg.svd(centered, full_matrices=False)
    xy = centered @ vt[:2].T
    span = xy.max(axis=0) - xy.min(axis=0)
    span[span == 0] = 1.0
    xy = 0.05 + 0.9 * (xy - xy.min(axis=0)) / span

    k = min(k, n)
    # farthest-point init, then a few Lloyd iterations on the embeddings
    centers = [mat[0]]
    for _ in range(1, k):
        d = np.min([np.linalg.norm(mat - c, axis=1) for c in centers], axis=0)
        centers.append(mat[int(d.argmax())])
    centers_arr = np.array(centers)
    labels = np.zeros(n, dtype=int)
    for _ in range(15):
        labels = np.linalg.norm(mat[:, None, :] - centers_arr[None, :, :], axis=2).argmin(axis=1)
        for j in range(k):
            members = mat[labels == j]
            if len(members):
                centers_arr[j] = members.mean(axis=0)
    return xy, labels
