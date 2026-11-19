// In-memory idempotency store for this demonstration.
// A production implementation should use a durable shared store (for example Redis or SQL).
const requests = new Map();

async function runIdempotently(key, fingerprint, operation) {
  const existing = requests.get(key);

  if (existing) {
    if (existing.fingerprint !== fingerprint) {
      const error = new Error("This Idempotency-Key was already used for a different request");
      error.code = "IDEMPOTENCY_CONFLICT";
      throw error;
    }

    const result = await existing.promise;
    return { result, replayed: true };
  }

  const entry = {
    fingerprint,
    promise: Promise.resolve().then(operation)
  };

  requests.set(key, entry);

  try {
    const result = await entry.promise;
    return { result, replayed: false };
  } catch (error) {
    // Failed operations are removed so the caller can retry with the same key.
    if (requests.get(key) === entry) requests.delete(key);
    throw error;
  }
}

module.exports = { runIdempotently };
