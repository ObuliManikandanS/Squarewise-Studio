import { spawn } from 'node:child_process';
if (process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET) {
  await import('./migrate-render.mjs');
} else {
  console.warn('[VortexPlots] DATABASE_URL or BETTER_AUTH_SECRET is not configured; public research pages will run, account storage is unavailable.');
}

const port = process.env.PORT || '10000';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const child = spawn(process.execPath, [
  'node_modules/next/dist/bin/next', 'start', '--hostname', '0.0.0.0', '--port', port,
], { stdio: 'inherit', env: process.env });
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
