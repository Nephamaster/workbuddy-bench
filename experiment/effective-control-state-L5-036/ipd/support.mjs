import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, readdir, realpath, statfs, writeFile } from 'node:fs/promises';
import { basename, join, relative, resolve, sep } from 'node:path';

export const taskId = 'effective-control-state-L5-036';
export const answerName = 'effective_control_state.json';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
export async function writeJson(path, value) {
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
}

export function adaptFactory(source, config) {
  const edits = [
    ['\nasync function createDefaultService(', '\nexport async function createDefaultService('],
    ['const docker = new DockerCli({', `const docker = new DockerCli({\n\t\t\texecutable: ${JSON.stringify(config.dockerWrapper)},`],
    ['dockerConfigDirectory: join("/tmp", "pi-ipd-docker-config", projectIdentity),',
      `dockerConfigDirectory: join(${JSON.stringify(config.state)}, "docker-config", projectIdentity),`],
    ['storageRoot: join("/tmp", "pi-ipd-environments", projectIdentity),',
      `storageRoot: join(${JSON.stringify(config.state)}, "environments", projectIdentity),`],
    ['["general-purpose", "code-node24", "office-pptx"].map(async (profile) => {',
      '["general-purpose"].map(async (profile) => {'],
  ];
  for (const [before, after] of edits) {
    if (source.split(before).length !== 2) throw new Error(`Pi factory changed; review adapter anchor: ${before}`);
    source = source.replace(before, after);
  }
  return source;
}

export function dockerArguments(args, config) {
  if (!['create', 'run'].includes(args[0])) return args;
  if (!/^wbbench[0-9a-f]+\.slice$/.test(config.slice)) throw new Error('Invalid benchmark slice');
  if (args.some(arg => arg === '--cgroup-parent' || arg.startsWith('--cgroup-parent='))) {
    throw new Error('An existing cgroup parent must not override the benchmark budget');
  }
  return [args[0], '--cgroup-parent', config.slice, '--label', `wb.bench.trial=${config.id}`, ...args.slice(1)];
}

export async function assertBudget(config) {
  const group = `/sys/fs/cgroup/${config.slice}`;
  const [cpu, memory, swap, membership] = await Promise.all([
    readFile(join(group, 'cpu.max'), 'utf8'), readFile(join(group, 'memory.max'), 'utf8'),
    readFile(join(group, 'memory.swap.max'), 'utf8'), readFile('/proc/self/cgroup', 'utf8'),
  ]);
  const [quota, period] = cpu.trim().split(/\s+/).map(Number);
  if (quota / period !== 2 || memory.trim() !== '4294967296' || swap.trim() !== '0') {
    throw new Error('Whole-trial CPU/memory/swap limits are not active');
  }
  if (!membership.split('\n').some(line => line.startsWith(`0::/${config.slice}/`))) {
    throw new Error('Controller is not inside the benchmark slice');
  }
  const filesystem = await statfs(config.state, { bigint: true });
  const bytes = filesystem.blocks * filesystem.bsize;
  if (bytes > 10n * 1024n ** 3n || bytes < 9n * 1024n ** 3n) {
    throw new Error('Task state is not on the prepared 10 GiB filesystem');
  }
  return { cpu: cpu.trim(), memory: memory.trim(), swap: swap.trim(), membership: membership.trim(), filesystemBytes: String(bytes) };
}

export async function exportAnswer(finalSubmission, workspace) {
  const matches = finalSubmission.files.filter(file => basename(file.path) === answerName);
  if (matches.length !== 1) throw new Error(`Expected exactly one final ${answerName}; found ${matches.length}`);
  const file = matches[0];
  const root = await realpath(finalSubmission.directory);
  const source = resolve(root, file.path);
  if (!source.startsWith(root + sep) || !(await lstat(source)).isFile() || await realpath(source) !== source) {
    throw new Error('Final artifact is not a regular file inside its delivery directory');
  }
  if (sha256(await readFile(source)) !== file.sha256) throw new Error('Final artifact hash mismatch');
  const destination = join(workspace, 'output', answerName);
  await mkdir(resolve(destination, '..'), { recursive: true });
  await copyFile(source, destination);
  return { source, destination, sha256: file.sha256 };
}

export async function collectMetrics(sessionRoot) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) files.push(path);
    }
  }
  try { await walk(sessionRoot); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 };
  const sessions = [];
  const tools = {};
  const requestedTools = {};
  let assistantTurns = 0;
  let toolErrors = 0;
  let compactions = 0;
  let messagesWithoutUsage = 0;
  for (const path of files.sort()) {
    let turns = 0;
    for (const [line, text] of (await readFile(path, 'utf8')).split('\n').entries()) {
      if (!text.trim()) continue;
      let entry;
      try { entry = JSON.parse(text); } catch { throw new Error(`Invalid Session JSON: ${path}:${line + 1}`); }
      if (entry.type === 'compaction') compactions++;
      const message = entry.type === 'message' ? entry.message : undefined;
      if (message?.role === 'assistant') {
        turns++;
        assistantTurns++;
        if (!message.usage) messagesWithoutUsage++;
        for (const key of Object.keys(totals)) totals[key] += message.usage?.[key] || 0;
        for (const part of message.content || []) if (part.type === 'toolCall') {
          requestedTools[part.name] = (requestedTools[part.name] || 0) + 1;
        }
      }
      if (message?.role === 'toolResult') {
        tools[message.toolName] = (tools[message.toolName] || 0) + 1;
        if (message.isError) toolErrors++;
      }
    }
    sessions.push({ file: relative(sessionRoot, path), assistantTurns: turns });
  }
  return { sessions, assistantTurns, tools, toolCalls: Object.values(tools).reduce((a, b) => a + b, 0),
    requestedTools, requestedToolCalls: Object.values(requestedTools).reduce((a, b) => a + b, 0),
    toolErrors, compactions, messagesWithoutUsage,
    usage: { ...totals, inputIncludingCache: totals.input + totals.cacheRead + totals.cacheWrite } };
}
