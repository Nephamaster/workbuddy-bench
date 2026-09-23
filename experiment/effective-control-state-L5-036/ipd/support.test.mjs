import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { adaptFactory, collectMetrics, dockerArguments, exportAnswer, sha256 } from './support.mjs';

test('all managed containers share the trial parent without altering node limits', () => {
  const config = { id: 'abc', slice: 'wbbenchabc.slice' };
  const args = dockerArguments(['create', '--memory', '2147483648', '--cpus', '2', 'image'], config);
  assert.deepEqual(args, ['create', '--cgroup-parent', 'wbbenchabc.slice', '--label', 'wb.bench.trial=abc',
    '--memory', '2147483648', '--cpus', '2', 'image']);
  assert.deepEqual(dockerArguments(['image', 'inspect', 'image'], config), ['image', 'inspect', 'image']);
  assert.throws(() => dockerArguments(['run', '--cgroup-parent=other.slice', 'image'], config), /override/);
  assert.throws(() => dockerArguments(['create', 'image'], { ...config, slice: 'system.slice' }), /Invalid/);
});

test('factory adaptation fails closed when upstream is incompatible', () => {
  assert.throws(() => adaptFactory('export function unrelated() {}', {}), /factory changed/);
});

test('delivery requires an unambiguous, regular, hash-verified final artifact', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ipd-delivery-test-'));
  try {
    const delivery = join(root, 'delivery');
    const workspace = join(root, 'workspace');
    await mkdir(delivery);
    const content = '{"metadata":{}}\n';
    const entry = { path: 'effective_control_state.json', sha256: sha256(content) };
    await writeFile(join(delivery, entry.path), content);
    await exportAnswer({ directory: delivery, files: [entry] }, workspace);
    assert.equal(await readFile(join(workspace, 'output', entry.path), 'utf8'), content);
    await assert.rejects(exportAnswer({ directory: delivery, files: [entry, entry] }, workspace), /exactly one/);
    await assert.rejects(exportAnswer({ directory: delivery, files: [{ ...entry, sha256: 'wrong' }] }, workspace), /hash/);
    await rm(join(delivery, entry.path));
    await writeFile(join(root, entry.path), content);
    await symlink(join(root, entry.path), join(delivery, entry.path));
    await assert.rejects(exportAnswer({ directory: delivery, files: [entry] }, workspace), /regular file/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('metrics include all Sessions and cache usage without counting stream deltas', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ipd-metrics-test-'));
  try {
    await mkdir(join(root, 'reviewer'));
    const message = { type: 'message', message: { role: 'assistant', usage: {
      input: 2, output: 3, cacheRead: 5, cacheWrite: 7, totalTokens: 17,
    }, content: [{ type: 'toolCall', name: 'read', id: 't1' }] } };
    await writeFile(join(root, 'producer.jsonl'), [JSON.stringify(message), JSON.stringify({ type: 'message_update', usage: message.message.usage })].join('\n'));
    await writeFile(join(root, 'reviewer', 'session.jsonl'), [JSON.stringify(message),
      JSON.stringify({ type: 'message', message: { role: 'toolResult', toolName: 'read', isError: false } })].join('\n'));
    const metrics = await collectMetrics(root);
    assert.equal(metrics.assistantTurns, 2);
    assert.equal(metrics.requestedToolCalls, 2);
    assert.equal(metrics.toolCalls, 1);
    assert.equal(metrics.usage.inputIncludingCache, 28);
    assert.equal(metrics.usage.totalTokens, 34);
  } finally { await rm(root, { recursive: true, force: true }); }
});
