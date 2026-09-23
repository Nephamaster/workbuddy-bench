import { chmod, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { userInfo } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adaptFactory, readJson, sha256, taskId, writeJson } from './support.mjs';

const tools = dirname(fileURLToPath(import.meta.url));
const bench = resolve(tools, '../../..');
const [trialArg, sourceArg, nodeBinary] = process.argv.slice(2);
if (!trialArg || !sourceArg || !nodeBinary) throw new Error('Usage: init.mjs TRIAL PI_SOURCE NODE_BINARY');
const trial = resolve(trialArg);
const source = resolve(sourceArg);
const state = join(trial, 'state');
const runtime = join(trial, 'runtime', 'pi');
const user = userInfo();
if (user.uid === 0) throw new Error('Prepare as the regular Docker-enabled user, not root');
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
const commit = git('rev-parse', 'HEAD');
const id = randomBytes(6).toString('hex');
const config = { version: 1, id, taskId, trial, state, runtime, bench, source, nodeBinary,
  uid: user.uid, gid: user.gid, user: user.username, slice: `wbbench${id}.slice`,
  image: `workbuddy-bench/ipd-general:${commit.slice(0, 12)}-${id}`,
  verifierImage: `workbuddy-bench/ipd-verifier:${id}`,
  dockerWrapper: join(runtime, 'wbbench', 'docker-wrapper'), dockerBinary: '/usr/bin/docker',
  timeoutSeconds: 4800, sourceCommit: commit,
  sourceDiffSha256: sha256(execFileSync('git', ['-C', source, 'diff', '--binary', 'HEAD'])),
  lockSha256: sha256(await readFile(join(source, 'package-lock.json'))),
};
await mkdir(runtime, { recursive: true });
for (const entry of ['packages', 'scripts', 'node_modules']) {
  execFileSync('rsync', ['-a', '--exclude=.git', '--exclude=.pi', '--exclude=.env*', '--exclude=.npmrc',
    '--exclude=__pycache__', `${source}/${entry}/`, `${runtime}/${entry}/`], { stdio: 'inherit' });
}
for (const file of ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.base.json']) {
  await copyFile(join(source, file), join(runtime, file));
}
const adapters = join(runtime, 'wbbench');
await mkdir(adapters);
for (const file of ['controller.mjs', 'docker-shim.mjs', 'support.mjs']) await copyFile(join(tools, file), join(adapters, file));
await writeJson(join(adapters, 'config.json'), config);
const quote = value => `'${value.replaceAll("'", "'\\''")}'`;
await writeFile(config.dockerWrapper, `#!/bin/sh\nexec ${quote(nodeBinary)} ${quote(join(adapters, 'docker-shim.mjs'))} "$@"\n`, { mode: 0o755 });
const factoryPath = join(runtime, 'packages/ipd/src/tool/default-ipd-extension.ts');
const factory = await readFile(factoryPath, 'utf8');
await writeFile(join(trial, 'upstream-default-ipd-extension.ts'), factory);
await writeFile(factoryPath, adaptFactory(factory, config));
const profilePath = join(runtime, 'packages/ipd/environments/general-purpose/profile.template.json');
const profile = await readJson(profilePath);
profile.image.reference = config.image;
await writeJson(profilePath, profile);
const dockerfilePath = join(runtime, 'packages/ipd/environments/general-purpose/Dockerfile');
const dockerfile = await readFile(dockerfilePath, 'utf8');
// This recipe uses ordinary instructions; avoid an unnecessary remote frontend pull.
await writeFile(dockerfilePath, dockerfile.replace(/^# syntax=docker\/dockerfile:1\r?\n/, ''));
for (const directory of ['project', 'materials/workspace', 'workspace', 'logs', 'home', 'tmp', 'pi-agent']) {
  await mkdir(join(state, directory), { recursive: true });
}
const task = join(bench, 'datasets/wb-bench-office-v1.0/tasks', taskId);
await copyFile(join(task, 'instruction.md'), join(trial, 'instruction.md'));
await copyFile(join(task, 'environment/workspace.tar.gz'), join(trial, 'initial-workspace.tar.gz'));
for (const destination of ['materials/workspace', 'workspace']) {
  execFileSync('tar', ['-xzf', join(trial, 'initial-workspace.tar.gz'), '-C', join(state, destination)]);
}
const agentSource = process.env.PI_BENCH_CONFIG_SOURCE || join(user.homedir, '.pi/agent');
const agentTarget = join(state, 'pi-agent');
await chmod(agentTarget, 0o700);
for (const file of ['models.json', 'auth.json']) {
  try { await copyFile(join(agentSource, file), join(agentTarget, file)); await chmod(join(agentTarget, file), 0o600); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
const settings = await readJson(join(agentSource, 'settings.json'));
if (!settings.defaultProvider || !settings.defaultModel) throw new Error('Configure Pi defaultProvider/defaultModel first');
const keep = ['defaultProvider', 'defaultModel', 'retry', 'compaction', 'httpIdleTimeoutMs', 'images'];
await writeJson(join(agentTarget, 'settings.json'), Object.fromEntries(keep.filter(key => key in settings).map(key => [key, settings[key]])));
await writeJson(join(trial, 'config.json'), config);
await writeJson(join(trial, 'inputs.json'), {
  instructionSha256: sha256(await readFile(join(trial, 'instruction.md'))),
  archiveSha256: sha256(await readFile(join(trial, 'initial-workspace.tar.gz'))),
  provider: settings.defaultProvider, model: settings.defaultModel, thinking: 'high', businessSkill: null,
});
await writeFile(join(trial, config.slice), `[Unit]\nDescription=WorkBuddy IPD trial ${id}\n[Slice]\nCPUAccounting=yes\nCPUQuota=200%\nMemoryAccounting=yes\nMemoryMax=4294967296\nMemorySwapMax=0\n`);
console.log(JSON.stringify({ trial, source, sourceCommit: commit, image: config.image,
  model: `${settings.defaultProvider}/${settings.defaultModel}`, slice: config.slice }, null, 2));
