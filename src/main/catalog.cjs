const USER_AGENT = 'AstraLauncher/0.8.2 (Windows desktop launcher)';
const kinds = { mods: 'mod', modpacks: 'modpack', shaders: 'shader', resources: 'resourcepack' };

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, ...headers }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    if (response.status === 403) throw new Error('Доступ к API отклонён. Проверь ключ и права приложения.');
    if (response.status === 429) throw new Error('Слишком много запросов. Попробуй через минуту.');
    throw new Error(`Источник ответил кодом ${response.status}.`);
  }
  return response.json();
}

async function searchModrinth({ kind, query = '', offset = 0 }) {
  if (!kinds[kind]) throw new Error('Неизвестный раздел каталога.');
  const url = new URL('https://api.modrinth.com/v2/search');
  url.searchParams.set('facets', JSON.stringify([[`project_type:${kinds[kind]}`]]));
  url.searchParams.set('index', query ? 'relevance' : 'downloads');
  url.searchParams.set('limit', '24');
  url.searchParams.set('offset', String(Math.max(0, Math.min(480, Number(offset) || 0))));
  if (query) url.searchParams.set('query', String(query).slice(0, 100));
  const data = await getJson(url);
  return {
    total: data.total_hits || 0,
    items: (data.hits || []).map(hit => ({
      source: 'modrinth', kind, id: hit.project_id, slug: hit.slug,
      name: hit.title, description: hit.description, author: hit.author,
      downloads: hit.downloads, icon: hit.icon_url,
      url: `https://modrinth.com/${kinds[kind]}/${encodeURIComponent(hit.slug)}`,
      versions: hit.versions || [],
    })),
  };
}

async function searchCurseForge({ kind, query = '', offset = 0 }, key) {
  if (!kinds[kind]) throw new Error('Неизвестный раздел каталога.');
  if (!key) throw new Error('Добавь ключ CurseForge API в настройках каталога.');
  const url = new URL('https://api.curseforge.com/v1/mods/search');
  url.searchParams.set('gameId', '432');
  url.searchParams.set('pageSize', '24');
  url.searchParams.set('index', String(Math.max(0, Math.min(480, Number(offset) || 0))));
  url.searchParams.set('sortField', '6');
  url.searchParams.set('sortOrder', 'desc');
  if (query) url.searchParams.set('searchFilter', String(query).slice(0, 100));
  // Class IDs are resolved from the official API instead of hard-coded guesses.
  const classes = await getJson('https://api.curseforge.com/v1/categories?gameId=432', { 'x-api-key': key });
  const classNames = {
    mods: ['mc mods'], modpacks: ['modpacks'], shaders: ['shaders'], resources: ['resource packs', 'texture packs'],
  };
  const found = (classes.data || []).find(c => !c.parentCategoryId && classNames[kind].includes(String(c.name).toLowerCase()));
  if (!found) throw new Error('Раздел не найден в категориях CurseForge.');
  url.searchParams.set('classId', String(found.id));
  const data = await getJson(url, { 'x-api-key': key });
  return {
    total: data.pagination?.totalCount || 0,
    items: (data.data || []).map(item => ({
      source: 'curseforge', kind, id: String(item.id), slug: item.slug,
      name: item.name, description: item.summary, author: item.authors?.map(a => a.name).join(', ') || '',
      downloads: item.downloadCount, icon: item.logo?.thumbnailUrl || item.logo?.url,
      url: item.links?.websiteUrl || '', versions: [],
    })),
  };
}

module.exports = { searchModrinth, searchCurseForge };
