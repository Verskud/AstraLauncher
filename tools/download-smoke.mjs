import { unlink } from 'node:fs/promises';

const pages = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = pages.find(item => item.title === 'AstraLauncher');
if (!page) throw new Error('AstraLauncher window not found');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
ws.addEventListener('message', event => {
  const result = JSON.parse(event.data);
  if (result.id !== 1) return;
  if (result.result?.exceptionDetails) { console.error(result.result.exceptionDetails); process.exitCode = 1; }
  else {
    const output = result.result.result.value;
    console.log(output);
    if (output?.path) unlink(output.path).then(() => ws.close());
    else { process.exitCode = 1; ws.close(); }
  }
});
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: {
  expression: `window.astraDesktop.downloadProject({source:'modrinth',kind:'mods',id:'AANobbMI',gameVersion:'1.21.1',loader:'fabric'}).then(x=>({path:x.path,version:x.version,dependencies:x.dependencies}))`,
  returnByValue: true, awaitPromise: true,
} }));
