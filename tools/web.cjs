const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { homedir } = require('node:os');
const { join, resolve } = require('node:path');
const { parseEnv } = require('node:util');

const [command, ...args] = process.argv.slice(2);
const root = resolve(__dirname, '..');
const variable = 'EXPO_PUBLIC_GROQ_KEY';

function readKey(file) {
  try {
    return parseEnv(readFileSync(file, 'utf8'))[variable]?.trim();
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

const commands = {
  start: ['start', '--web', '--localhost'],
  build: ['export', '--platform', 'web', '--output-dir', 'dist'],
};
if (!Object.hasOwn(commands, command)) throw new Error('Use npm run web or npm run build:web.');

const env = { ...process.env };
const userSettings = process.platform === 'win32'
  ? join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'PARALLEL', 'web.env')
  : join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'parallel', 'web.env');
const mode = command === 'build' ? 'production' : 'development';
const files = [`.env.${mode}.local`, '.env.local', `.env.${mode}`, '.env']
  .map((name) => join(root, name)).concat(userSettings);

if (!Object.hasOwn(env, variable)) {
  const key = files.map(readKey).find(Boolean);
  if (key) env[variable] = key;
}
if (!env[variable]?.trim()) {
  console.log('Ключ Groq не найден в локальных настройках. Доступен DEMO CORE.');
}

const expo = spawn(process.execPath, [require.resolve('expo/bin/cli'), ...commands[command], ...args], {
  cwd: root,
  env,
  stdio: 'inherit',
});
expo.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
expo.on('exit', (code, signal) => {
  if (!signal) process.exitCode = code ?? 1;
});
