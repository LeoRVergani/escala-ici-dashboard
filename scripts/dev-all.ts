import { spawn } from 'node:child_process';

const commands = [
  { name: 'web', command: 'npm', args: ['run', 'dev:web'] },
  { name: 'api', command: 'npm', args: ['run', 'dev:api'] },
] as const;

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.on('exit', (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
  child.on('error', (error) => {
    console.error(`[${name}]`, error.message);
    process.exitCode = 1;
  });
  return child;
});

function stopChildren() {
  for (const child of children) child.kill();
}

process.on('SIGINT', stopChildren);
process.on('SIGTERM', stopChildren);
