import { solve } from './core/solver/index.js';

self.onmessage = (e) => {
  const { id, opts } = e.data;
  try {
    const result = solve(opts);
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: err.message, validation: err.validation || null });
  }
};
