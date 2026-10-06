import { execSync, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL('..', import.meta.url)));

for (let port = 5173; port <= 5180; port++) {
  try {
    const pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (pids) {
      for (const pid of pids.split(/\s+/)) {
        try {
          execSync(`kill -9 ${pid}`);
          console.log(`Killed PID ${pid} on port ${port}`);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* port free */
  }
}

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: root,
});
child.on('exit', (code) => process.exit(code ?? 0));
