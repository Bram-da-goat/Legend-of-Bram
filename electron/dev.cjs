const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const projectPath = path.join(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const electronPath = require('electron');

const vite = spawn(
  npmCommand,
  ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
  { cwd: projectPath, stdio: 'inherit', shell: process.platform === 'win32' },
);

function waitForVite(attempt = 0) {
  http.get('http://127.0.0.1:5173', response => {
    response.resume();
    launchElectron();
  }).on('error', () => {
    if (attempt >= 80) {
      console.error('The Vite development server did not start.');
      vite.kill();
      process.exit(1);
    }
    setTimeout(() => waitForVite(attempt + 1), 250);
  });
}

function launchElectron() {
  const desktop = spawn(electronPath, ['.', '--dev'], {
    cwd: projectPath,
    stdio: 'inherit',
  });

  desktop.on('close', code => {
    vite.kill();
    process.exit(code ?? 0);
  });
}

vite.on('close', code => {
  if (code && code !== 0) process.exit(code);
});

process.on('SIGINT', () => vite.kill());
process.on('SIGTERM', () => vite.kill());

waitForVite();
