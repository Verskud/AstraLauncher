
const pages = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const page = pages.find(item => item.title === 'AstraLauncher');
if (!page) throw new Error('AstraLauncher window not found');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});
let sequence = 0;
const pending = new Map();
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(new Error(message.error.message)) : resolve(message.result);
});
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const data = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (data.exceptionDetails) throw new Error(data.exceptionDetails.text);
  return data.result.value;
}
function assert(condition, message) { if (!condition) throw new Error(message); }
assert(await evaluate('Boolean(window.astraDesktop?.catalogSearch)'), 'IPC bridge missing');
await evaluate('document.querySelector("[data-page=mods]").click()');
await new Promise(resolve => setTimeout(resolve, 3000));
const catalog = await evaluate('({status:document.querySelector("#live-status")?.textContent, cards:document.querySelectorAll(".live-card").length, first:document.querySelector(".live-card .mod-title")?.textContent})');
assert(catalog.cards > 0, `Modrinth catalog empty: ${catalog.status}`);
await evaluate('document.querySelector("[data-catalog-tab=shaders]").click()');
await new Promise(resolve => setTimeout(resolve, 2000));
const shaders = await evaluate('({status:document.querySelector("#live-status")?.textContent, cards:document.querySelectorAll(".live-card").length, first:document.querySelector(".live-card .mod-title")?.textContent})');
assert(shaders.cards > 0, `Shader catalog empty: ${shaders.status}`);
await evaluate('document.querySelector("[data-live-source=curseforge]").click()');
await new Promise(resolve => setTimeout(resolve, 600));
const curseforge = await evaluate('({website: Boolean(document.querySelector("#curseforge-search-form")), importHint: document.querySelector(".manual-content-panel")?.textContent})');
assert(curseforge.website && curseforge.importHint, 'CurseForge website and manual installation controls missing');
await evaluate('document.querySelector("[data-page=accounts]").click()');
const microsoft = await evaluate('Boolean(document.querySelector("[data-live-microsoft]"))');
assert(microsoft, 'Microsoft account control missing');
console.log(JSON.stringify({ catalog, shaders, curseforge, microsoft }, null, 2));
ws.close();
