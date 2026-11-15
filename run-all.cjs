const { spawn, execSync } = require('child_process');

console.log('\x1b[36m%s\x1b[0m', '🚀 Starting Medic E-Service V2 (Rust Backend + Vite Frontend)...');

const isWindows = process.platform === 'win32';

// 0. Auto-free ports 3001 and 5173 if occupied by previous runs
if (isWindows) {
  try {
    execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr ":3001 "\') do taskkill /f /pid %a', { stdio: 'ignore' });
  } catch (e) {}
  try {
    execSync('for /f "tokens=5" %a in (\'netstat -aon ^| findstr ":5173 "\') do taskkill /f /pid %a', { stdio: 'ignore' });
  } catch (e) {}
}

// 1. Spawn Rust Backend
const rust = spawn(isWindows ? 'cargo.exe' : 'cargo', ['run', '--manifest-path', 'backend/Cargo.toml'], {
  stdio: 'pipe',
  shell: isWindows,
  env: { ...process.env, RUST_LOG: 'backend=info,tower_http=info' }
});

rust.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[35m[Rust]\x1b[0m ${data}`);
});

rust.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[35m[Rust]\x1b[0m ${data}`);
});

rust.on('error', (err) => {
  console.error('\x1b[31m[Rust Error]\x1b[0m', err.message);
});

// 2. Spawn Vite Frontend
const vite = spawn(isWindows ? 'cmd.exe' : 'npm', isWindows ? ['/c', 'npx', 'vite'] : ['run', 'dev'], {
  stdio: 'pipe',
  shell: isWindows,
  env: { ...process.env }
});

vite.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[36m[Vite]\x1b[0m ${data}`);
});

vite.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[36m[Vite]\x1b[0m ${data}`);
});

vite.on('error', (err) => {
  console.error('\x1b[31m[Vite Error]\x1b[0m', err.message);
});

function cleanup() {
  console.log('\n\x1b[33m%s\x1b[0m', '🛑 Stopping all services...');
  try {
    if (isWindows) {
      if (rust.pid) spawn('taskkill', ['/pid', rust.pid, '/f', '/t']);
      if (vite.pid) spawn('taskkill', ['/pid', vite.pid, '/f', '/t']);
    } else {
      rust.kill('SIGTERM');
      vite.kill('SIGTERM');
    }
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
