const fs = require('node:fs/promises');
const path = require('node:path');
const { instanceFolder, validateProfile } = require('./game-loader.cjs');
const LIMIT = 2 * 1024 * 1024;
function playerName(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_]{1,16}$/.test(value)) throw new Error('Имя игрока: 1–16 латинских букв, цифр или символов _.');
  return value;
}
function png(bytes, kind) {
  if (bytes.length < 33 || bytes.length > LIMIT || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || bytes.toString('ascii',12,16) !== 'IHDR') throw new Error('Нужен PNG-файл размером до 2 МБ.');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  if (kind === 'skin' ? width !== 64 || ![32,64].includes(height) : width !== 64 || height !== 32) throw new Error(kind === 'skin' ? 'Скин должен быть 64×64 или 64×32.' : 'Плащ должен быть 64×32.');
  return bytes;
}
function createPlayerSkins(root, { download, decodePng } = {}) {
  const folder = path.join(root,'player-appearance'), settings = path.join(folder,'selection.json');
  async function selection() { try { return JSON.parse(await fs.readFile(settings,'utf8')); } catch(error) { if(error.code==='ENOENT')return { source:'local',model:'classic' }; throw error; } }
  async function store(value) { await fs.mkdir(folder,{recursive:true}); await fs.writeFile(settings,JSON.stringify(value,null,2)); return status(); }
  async function texture(kind) { try { return png(await fs.readFile(path.join(folder,`${kind}.png`)),kind); } catch(error) { if(error.code==='ENOENT')return null; throw error; } }
  async function status() {
    const config = await selection(), skin = await texture('skin'), cape = await texture('cape');
    return { source:config.source, model:config.model, skin:skin ? `data:image/png;base64,${skin.toString('base64')}` : null, cape:cape ? `data:image/png;base64,${cape.toString('base64')}` : null };
  }
  async function importTexture(filename,kind) {
    if (!['skin','cape'].includes(kind)) throw new Error('Неизвестный тип текстуры.');
    if ((await fs.stat(filename)).size > LIMIT) throw new Error('PNG превышает 2 МБ.');
    const bytes = png(await fs.readFile(filename),kind);
    if (decodePng && !decodePng(bytes)) throw new Error('Повреждённый PNG-файл.');
    await fs.mkdir(folder,{recursive:true}); await fs.writeFile(path.join(folder,`${kind}.png`),bytes);
    return store({ ...await selection(), source:'local' });
  }
  async function removeTexture(kind) {
    if (!['skin','cape'].includes(kind)) throw new Error('Неизвестный тип текстуры.');
    await fs.rm(path.join(folder,`${kind}.png`),{force:true}); return status();
  }
  async function setSource(source,model) {
    if (!['local','ely','mojang'].includes(source) || !['classic','slim'].includes(model)) throw new Error('Некорректный источник или модель скина.');
    return store({source,model});
  }
  async function remote(name) {
    playerName(name); const config = await selection();
    if (config.source === 'local') return status();
    const get = async (url, json=false, redirects=0) => {
      const target = new URL(url);
      if (!['api.mojang.com','sessionserver.mojang.com','textures.minecraft.net','skinsystem.ely.by','ely.by'].includes(target.hostname) || target.username || target.password || target.port) throw new Error('Неизвестный адрес текстуры.');
      target.protocol='https:';
      const response = await fetch(target,{signal:AbortSignal.timeout(15000),redirect:'manual',headers:{'User-Agent':'AstraLauncher'}});
      if ([301,302,303,307,308].includes(response.status)) {
        await response.body?.cancel();
        if (redirects >= 3 || !response.headers.get('location')) throw new Error('Слишком много перенаправлений источника скинов.');
        return get(new URL(response.headers.get('location'),target),json,redirects+1);
      }
      if (response.status === 404 || response.status === 204) return null;
      if (!response.ok) throw new Error(`Источник скинов ответил кодом ${response.status}.`);
      let size=0; const chunks=[];
      for await(const chunk of response.body) { size+=chunk.length; if(size>LIMIT)throw new Error('Ответ источника скинов слишком большой.'); chunks.push(Buffer.from(chunk)); }
      const bytes=Buffer.concat(chunks); return json ? JSON.parse(bytes.toString('utf8')) : bytes;
    };
    let urls;
    if (config.source === 'ely') urls={skin:`https://skinsystem.ely.by/skins/${name}.png`,cape:`https://skinsystem.ely.by/cloaks/${name}.png`};
    else {
      const profile=await get(`https://api.mojang.com/users/profiles/minecraft/${name}`,true);
      if(!profile || !/^[a-f\d]{32}$/i.test(profile.id))return {...config,skin:null,cape:null};
      const session=await get(`https://sessionserver.mojang.com/session/minecraft/profile/${profile.id}`,true);
      const encoded=session?.properties?.find(item=>item.name==='textures')?.value;
      const textures=encoded ? JSON.parse(Buffer.from(encoded,'base64').toString()).textures : {};
      urls={skin:textures?.SKIN?.url,cape:textures?.CAPE?.url};
      config.model=textures?.SKIN?.metadata?.model==='slim'?'slim':'classic';
    }
    const result={...config};
    await Promise.all(['skin','cape'].map(async kind=>{
      if(!urls[kind]) {result[kind]=null;return;}
      const url=new URL(urls[kind]);
      if(!['textures.minecraft.net','skinsystem.ely.by'].includes(url.hostname))throw new Error('Неизвестный адрес текстуры.');
      url.protocol='https:';
      const bytes=await get(url); result[kind]=bytes ? `data:image/png;base64,${png(bytes,kind).toString('base64')}` : null;
    }));
    return result;
  }
  async function prepare(profile,name) {
    const instance=instanceFolder(root,profile.id), marker=path.join(instance,'astra-skins.json');
    try { await fs.access(marker); } catch(error) { if(error.code==='ENOENT')return;throw error; }
    playerName(name);
    const config=await selection(), directory=path.join(instance,'CustomSkinLoader'), filename=path.join(directory,'CustomSkinLoader.json');
    await fs.mkdir(directory,{recursive:true});
    let previous={};
    try { previous=JSON.parse(await fs.readFile(filename,'utf8')); } catch(error) { if(error.code!=='ENOENT')throw new Error('Не удалось прочитать настройки CustomSkinLoader. Исправь JSON в папке сборки.'); }
    const ownNames=['AstraLocal','AstraEly'];
    const list=Array.isArray(previous.loadlist) ? previous.loadlist.filter(item=>!ownNames.includes(item?.name)) : [{name:'Mojang',type:'MojangAPI'}];
    if(config.source==='local') {
      for(const kind of ['skin','cape']) {
        const sub=kind==='skin'?'skins':'capes', output=path.join(directory,'Astra',sub,`${name}.png`), bytes=await texture(kind);
        await fs.mkdir(path.dirname(output),{recursive:true});
        if(bytes)await fs.writeFile(output,bytes);else await fs.rm(output,{force:true});
      }
      list.unshift({name:'AstraLocal',type:'Legacy',skin:'Astra/skins/{USERNAME}.png',cape:'Astra/capes/{USERNAME}.png',model:config.model==='slim'?'slim':'default',checkPNG:true});
    } else if(config.source==='ely') list.unshift({name:'AstraEly',type:'Legacy',skin:'https://skinsystem.ely.by/skins/{USERNAME}.png',cape:'https://skinsystem.ely.by/cloaks/{USERNAME}.png',model:config.model==='slim'?'slim':'auto',checkPNG:true});
    await fs.writeFile(filename,JSON.stringify({...previous,enableCape:true,loadlist:list},null,2));
  }
  async function install(profile,name) {
    validateProfile(profile); playerName(name);
    if(profile.loader==='Vanilla')throw new Error('Для CustomSkinLoader выбери сборку с Fabric, Quilt, Forge или NeoForge.');
    const instance=instanceFolder(root,profile.id), existing=path.join(instance,'CustomSkinLoader','CustomSkinLoader.json');
    try { JSON.parse(await fs.readFile(existing,'utf8')); } catch(error) { if(error.code!=='ENOENT')throw new Error('Некорректные настройки CustomSkinLoader.'); }
    const result=await download({source:'modrinth',kind:'mods',id:'idMHQ4n2',profileId:profile.id,gameVersion:profile.version,loader:profile.loader.toLowerCase()});
    await fs.writeFile(path.join(instance,'astra-skins.json'),JSON.stringify({enabled:true}));
    await prepare(profile,name); return result;
  }
  return {status,importTexture,removeTexture,setSource,remote,prepare,install};
}
module.exports={createPlayerSkins,png,playerName};
