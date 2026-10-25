// Menjalankan solver di Web Worker (UI tetap lancar). Cadangan: jalankan di thread utama.
import { solve } from './core/solver/index.js';
import SolverWorker from './solver.worker.js?worker&inline';

let worker = null;
let workerBroken = false;

function runInline(opts) {
  return new Promise((resolve, reject) => {
    setTimeout(() => { try { resolve(solve(opts)); } catch (e) { reject(e); } }, 40);
  });
}

export function solveAsync(opts) {
  const payload = { ...opts, state: Array.from(opts.state) };
  if (workerBroken || typeof Worker === 'undefined') return runInline(payload);
  if (!worker) {
    try {
      worker = new SolverWorker();
    } catch (e) {
      workerBroken = true;
      return runInline(payload);
    }
  }
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    let done = false;
    const onMsg = (e) => {
      if (e.data.id !== id) return;
      done = true; cleanup();
      if (e.data.ok) resolve(e.data.result);
      else { const err = new Error(e.data.error); err.validation = e.data.validation; reject(err); }
    };
    const onErr = () => {
      if (done) return;
      done = true; cleanup();
      workerBroken = true;
      try { worker.terminate(); } catch (e) { /* abaikan */ }
      worker = null;
      runInline(payload).then(resolve, reject);
    };
    const cleanup = () => { worker && worker.removeEventListener('message', onMsg); worker && worker.removeEventListener('error', onErr); };
    worker.addEventListener('message', onMsg);
    worker.addEventListener('error', onErr);
    worker.postMessage({ id, opts: payload });
  });
}
