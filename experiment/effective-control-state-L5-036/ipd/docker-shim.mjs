import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBudget, dockerArguments, readJson } from './support.mjs';

const config = await readJson(join(dirname(fileURLToPath(import.meta.url)), 'config.json'));
const args = process.argv.slice(2);
if (['create', 'run'].includes(args[0])) await assertBudget(config);
const child = spawn(config.dockerBinary, dockerArguments(args, config), { stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 128 : 1); });
