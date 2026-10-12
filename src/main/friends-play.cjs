const { validateProfile } = require('./game-loader.cjs');

const TUNNEL = { id: 'qANg5Jrr', name: 'e4mc', slug: 'e4mc', raw: /^e4mc(?:[-_.]|$)/i };
const LAN_SETTINGS = [
  { id: 'pimmstPB', name: 'OfflineLAN', slug: 'offlinelan', loaders: ['fabric'], raw: /^offlinelan(?:[-_.]|$)/i },
  { id: 'deYSo63V', name: 'LAN Properties', slug: 'lan-properties', loaders: ['fabric','quilt','forge','neoforge'], raw: /^lan[-_]?properties(?:[-_.]|$)/i },
  { id: '1FzEIbOs', name: 'More Players LAN', slug: 'more-players-lan', loaders: ['forge'], raw: /^more[-_]?players[-_]?lan(?:[-_.]|$)/i },
  { id: 'ccpv4ywN', name: 'LAN Server Options', slug: 'lan-server-options', loaders: ['fabric'], raw: /^lan[-_]?server[-_]?options(?:[-_.]|$)/i },
];

function createFriendsPlay({ resolve, download, listInstalled, onProgress = () => {} }) {
  const cache = new Map();
  const requestFor = (profile, project) => ({ source: 'modrinth', kind: 'mods', id: project.id, profileId: profile.id, gameVersion: profile.version, loader: profile.loader.toLowerCase() });
  async function available(profile, project) {
    const request = requestFor(profile, project), key = `${request.id}:${request.gameVersion}:${request.loader}`;
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return cached.value ? { ...cached.value } : null;
    try {
      const result = await resolve(request);
      const value = { id: project.id, name: project.name, slug: project.slug, versionId: result.versionId, version: result.version };
      if (!value.versionId) throw new Error('Источник не вернул ID версии мода.');
      cache.set(key, { until: Date.now() + 60000, value });
      return { ...value };
    } catch (error) {
      if (error.code !== 'NO_COMPATIBLE_VERSION') throw error;
      cache.set(key, { until: Date.now() + 60000, value: null });
      return null;
    }
  }
  async function plan(profile) {
    validateProfile(profile);
    if (profile.loader === 'Vanilla') return { reason: 'vanilla', tunnel: null, local: null };
    if (!/^\d+\.\d+(?:\.\d+)?$/.test(profile.version)) return { reason: 'unsupported', tunnel: null, local: null };
    const files = await listInstalled(profile.id);
    const active = project => files.find(file => file.kind === 'mods' && !file.disabled && (new RegExp(`^(?:\\d+-)?modrinth-${project.id}-`, 'i').test(file.filename) || project.raw.test(file.filename)));
    const tunnel = await available(profile, TUNNEL);
    if (!tunnel) return { reason: 'unsupported', tunnel: null, local: null };
    tunnel.installed = !!active(TUNNEL);
    const candidates = LAN_SETTINGS.filter(project => project.loaders.includes(profile.loader.toLowerCase()));
    // Keep an existing settings mod instead of installing a second mod for the same LAN screen.
    candidates.sort((a,b) => Number(!!active(b)) - Number(!!active(a)));
    let local = null;
    for (const project of candidates) {
      local = await available(profile, project);
      if (local) { local.installed = !!active(project); break; }
    }
    return { tunnel, local, reason: null };
  }
  async function install(profile, localProfiles) {
    const choice = await plan(profile);
    if (!choice.tunnel) throw new Error('Для этой версии Minecraft и загрузчика нет совместимого e4mc.');
    if (localProfiles && !choice.local) throw new Error('Для этой сборки не найден совместимый мод настроек входа по LAN.');
    const installed = [], projects = [choice.tunnel, ...(localProfiles ? [choice.local] : [])];
    for (const project of projects) {
      if (project.installed) continue;
      onProgress({ profileId: profile.id, name: project.name });
      try {
        const result = await download({ ...requestFor(profile, project), versionId: project.versionId });
        installed.push({ ...result, name: project.name, source: 'modrinth' }, ...(result.installedDependencies || []));
      } catch (error) {
        return { ready: false, installed, error: error.message };
      }
    }
    return { ready: true, installed };
  }
  return { plan, install };
}
module.exports = { createFriendsPlay };
