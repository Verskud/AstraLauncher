const defaults={packs:[],profile:'Player',memory:4,backups:true,theme:'dark'};
let state;try{state=JSON.parse(localStorage.getItem('astra-v1'))||structuredClone(defaults);if(!Array.isArray(state.packs))throw Error();}catch{state=structuredClone(defaults)}
const modCount = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'мод' : [2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100) ? 'мода' : 'модов'}`;
let page='discover',query='',category='Все',loader='Все',selectedPack=null;
const installedByPack = new Map();
function installedRecordsForPack(pack, kind) {
  if (!pack) return [];
  const history = (state.downloads || []).filter(item => item && item.profileId === pack.id && item.kind === kind);
  const files = installedByPack.get(pack.id);
  if (!files) return [...new Map(history.filter(item => typeof item.path === 'string').reverse().map(item => [item.path.toLowerCase(), item])).values()];
  return files.filter(file => file.kind === kind).map(file => {
    const saved = history.find(item => typeof item.path === 'string' && item.path.toLowerCase() === file.path.toLowerCase());
    const name = file.filename.replace(/^\d+-/, '').replace(/^(modrinth|curseforge)-[^-]+-/, '').replace(/\.(jar|zip)$/i, '').replaceAll('_', ' ');
    return { ...file, ...saved, path: file.path, filename: file.filename, name: saved?.name && !/^[A-Za-z0-9]{8}$/.test(saved.name) ? saved.name : name, source: saved?.source || 'Файл сборки' };
  }).sort((a,b) => a.filename.localeCompare(b.filename));
}
async function refreshInstalled(profileId) {
  try {
    const files = await window.astraDesktop.listInstalledFiles(profileId);
    installedByPack.set(profileId, files);
    const present = new Set(files.map(file => file.path.toLowerCase()));
    const previous = state.downloads || [];
    const remaining = previous.filter(item => item && (item.profileId !== profileId || !['mods','shaders','resources'].includes(item.kind) || typeof item.path === 'string' && present.has(item.path.toLowerCase())));
    if (remaining.length !== previous.length) { state.downloads = remaining; save(); }
  }
  catch (error) { console.warn('Could not list installed files:', error); }
}
async function refreshInstalledAll() {
  await Promise.all(state.packs.map(pack => refreshInstalled(pack.id)));
  if (page === 'library' || page === 'pack') render();
}
const save=()=>{try{localStorage.setItem('astra-v1',JSON.stringify(state))}catch{toast('Не удалось сохранить данные: хранилище браузера недоступно.')}};
function rememberDownloads(records) {
  const seen = new Set();
  state.downloads = [...records, ...(state.downloads || [])].filter(item => {
    if (!item || typeof item.path !== 'string') return false;
    const key = item.path.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 100);
  save();
}
if (Array.isArray(state.downloads) && state.downloads.some((item,index,items) => !item || typeof item.path !== 'string' || items.findIndex(other => other && typeof other.path === 'string' && other.path.toLowerCase() === item.path.toLowerCase()) !== index)) rememberDownloads([]);
