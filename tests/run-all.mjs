// Jalankan semua tes: node tests/run-all.mjs
import { execSync } from 'node:child_process';
for (const t of ['algs.test.mjs', 'validate.test.mjs', 'rotation-fix.test.mjs 40', 'course.test.mjs', 'quiz.test.mjs', 'course4.test.mjs', 'course4-solver.test.mjs 10', 'quiz4.test.mjs', 'colors.test.mjs', 'lbl3.test.mjs 200', 'cfop3.test.mjs 200', 'solve-all.test.mjs 2,3,4,5 8']) {
  console.log('\n▶ ' + t);
  execSync('node tests/' + t, { stdio: 'inherit' });
}
console.log('\n✅ Semua tes lulus');
