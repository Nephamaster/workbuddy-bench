// Copied into the isolated Pi snapshot by init.mjs; uses its production service.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { ModelRuntime, createReadToolDefinition, createBashToolDefinition, createEditToolDefinition,
  createWriteToolDefinition, createGrepToolDefinition, createFindToolDefinition, createLsToolDefinition } from '../packages/coding-agent/src/index.ts';
import { createDefaultService } from '../packages/ipd/src/tool/default-ipd-extension.ts';
import { loadIpdSessionSettings } from '../packages/ipd/src/adapter/session-policy.ts';
import { ResourceAdmission } from '../packages/ipd/src/runtime/resource-admission.ts';
import { assertBudget, collectMetrics, exportAnswer, readJson, writeJson } from './support.mjs';

const config = await readJson(join(dirname(fileURLToPath(import.meta.url)), 'config.json'));
const mode = process.argv[2] || 'check';
if (!['check', 'select', 'run', 'metrics'].includes(mode)) throw new Error('Expected check, select, run, or metrics');
const project = join(config.state, 'project');
const logs = join(config.state, 'logs');
process.env.PI_CODING_AGENT_DIR = join(config.state, 'pi-agent');
process.env.PI_OFFLINE = '1';
process.env.PI_TELEMETRY = '0';
await mkdir(logs, { recursive: true });
try {
  for (const line of (await readFile(join(config.trial, 'model.env'), 'utf8')).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) throw new Error('model.env must contain literal KEY=value lines');
    if (!/(API_KEY|AUTH_TOKEN|OAUTH_TOKEN|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY)$/.test(match[1])) {
      throw new Error(`Unsupported model.env variable: ${match[1]}`);
    }
    process.env[match[1]] = match[2];
  }
} catch (error) { if (error.code !== 'ENOENT') throw error; }

async function metrics(runId) {
  const value = await collectMetrics(join(project, '.pi/ipd/runs', runId, 'sessions'));
  await writeJson(join(logs, 'metrics.json'), value);
  return value;
}

async function main() {
  if (mode === 'metrics') {
    const { runId } = await readJson(join(logs, 'receipt.json'));
    console.log(JSON.stringify(await metrics(runId), null, 2));
    return;
  }
  const settings = await readJson(join(process.env.PI_CODING_AGENT_DIR, 'settings.json'));
  const modelRuntime = await ModelRuntime.create({
    modelsPath: join(process.env.PI_CODING_AGENT_DIR, 'models.json'),
    authPath: join(process.env.PI_CODING_AGENT_DIR, 'auth.json'), allowModelNetwork: false,
  });
  const model = modelRuntime.getModel(settings.defaultProvider, settings.defaultModel);
  if (!model || !modelRuntime.hasConfiguredAuth(settings.defaultProvider)) throw new Error('Selected model or credentials are unavailable');
  // The service factory uses only these configuration fields from ExtensionContext.
  const context = { cwd: project, modelRegistry: modelRuntime, thinkingLevel: 'high', isProjectTrusted: () => false };
  const tools = [createReadToolDefinition, createBashToolDefinition, createEditToolDefinition,
    createWriteToolDefinition, createGrepToolDefinition, createFindToolDefinition, createLsToolDefinition].map(factory => factory(project));
  const service = await createDefaultService(context, model, [], tools,
    loadIpdSessionSettings(project, process.env.PI_CODING_AGENT_DIR),
    { environmentMode: 'docker', externalReadTools: [], allowedEndpoints: [] }, new ResourceAdmission());
  let runId;
  let timeout;
  let stopPromise;
  let interrupted = false;
  let finished = false;
  const started = Date.now();
  const stop = reason => {
    interrupted = true;
    if (runId && !stopPromise) {
      stopPromise = service.cancelRun(runId, reason);
      void stopPromise.catch(() => {}); // The main path awaits and reports cleanup failures.
    }
    return stopPromise;
  };
  const onSignal = () => { void stop('Benchmark interrupted by operator'); };
  try {
    const specs = service.listProcessSpecTemplates();
    if (mode === 'check') {
      console.log(JSON.stringify({ sourceCommit: config.sourceCommit, model: `${model.provider}/${model.id}`,
        businessSkill: null, processSpecs: specs.map(spec => ({ id: spec.process_spec_id, version: spec.version, name: spec.name })) }, null, 2));
      return;
    }
    if (mode === 'select') {
      console.log('0: 由 ST 自动选择 IPD 流程');
      specs.forEach((spec, index) => console.log(`${index + 1}: ${spec.name} (${spec.process_spec_id}@${spec.version})`));
      const terminal = createInterface({ input: process.stdin, output: process.stdout });
      const selectionAbort = new AbortController();
      terminal.once('close', () => selectionAbort.abort());
      terminal.once('SIGINT', () => terminal.close());
      let answer;
      try { answer = (await terminal.question('选择流程编号（0 保留 ST 自动选择）：', { signal: selectionAbort.signal })).trim(); }
      finally { terminal.close(); }
      if (!/^\d+$/.test(answer) || Number(answer) > specs.length) throw new Error('Invalid process selection');
      const spec = specs[Number(answer) - 1];
      await writeJson(join(config.trial, 'selection.json'), spec
        ? { mode: 'manual', processSpecId: spec.process_spec_id, processSpecVersion: spec.version }
        : { mode: 'automatic' });
      return;
    }
    await writeJson(join(logs, 'budget.json'), await assertBudget(config));
    // wx prevents accidentally turning one scored attempt into a resumed/repeated trial.
    await writeFile(join(logs, 'started.json'), JSON.stringify({ at: new Date().toISOString(), model: `${model.provider}/${model.id}`, thinkingLevel: 'high' }), { flag: 'wx' });
    const selection = await readJson(join(config.trial, 'selection.json'));
    const taskInput = { schema_version: 2, task_input_id: `bench-${config.id}`,
      raw_task: { text: await readFile(join(config.trial, 'instruction.md'), 'utf8'), source: 'benchmark:instruction.md' },
      materials: [{ material_id: 'task-workspace', reference: join(config.state, 'materials/workspace'),
        description: '题目提供的原始工作区，包含 input/ 材料和空 output/；需通过 task_material 绑定供节点读取。最终交付应包含原题要求的 effective_control_state.json。' }], unresolved_facts: [] };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    timeout = setTimeout(() => { void stop('Whole-trial 4800-second deadline reached'); }, config.timeoutSeconds * 1000);
    const receipt = selection.mode === 'automatic'
      ? await service.createRun(`bench-${config.id}`, taskInput)
      : await service.createRunFromTemplates(`bench-${config.id}`, taskInput, undefined, {
        processSpecId: selection.processSpecId, processSpecVersion: selection.processSpecVersion,
      });
    runId = receipt.runId;
    await writeJson(join(logs, 'receipt.json'), receipt);
    console.log(JSON.stringify(receipt));
    if (interrupted) await stop('Benchmark interrupted during Run acceptance');
    let revision = -1;
    while (true) {
      const state = await service.getRun(runId);
      if (state.revision !== revision) {
        console.log(JSON.stringify({ runId, phase: state.phase, status: state.status, revision: state.revision }));
        revision = state.revision;
      }
      if (state.status !== 'running' || interrupted) break;
      await delay(1000);
    }
    if (stopPromise) await stopPromise;
    const result = await service.getResult(runId);
    await writeJson(join(logs, 'result.json'), result);
    if (result.state.status === 'succeeded' && result.finalSubmission && !interrupted) {
      await writeJson(join(logs, 'delivery.json'), await exportAnswer(result.finalSubmission, join(config.state, 'workspace')));
      finished = true;
    } else {
      process.exitCode = 2;
      console.error(`IPD did not complete: ${result.state.status}; see state/logs/result.json`);
    }
  } finally {
    clearTimeout(timeout);
    process.off('SIGINT', onSignal);
    process.off('SIGTERM', onSignal);
    if (runId) {
      await writeJson(join(logs, 'timing.json'), { wallTimeSec: (Date.now() - started) / 1000, completed: finished, interrupted });
      if (!finished && !stopPromise) await service.cancelRun(runId, 'End of this independent benchmark attempt').catch(error => console.error(error.message));
    }
    await service.close();
    if (runId) await metrics(runId);
  }
}

try { await main(); }
catch (error) { console.error(error.stack || error.message); process.exitCode = 1; }
