const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {instanceFolder,validateProfile}=require('./game-loader.cjs');
const {hashFile}=require('./game-files.cjs');
const {openZip,safePath}=require('./zip-reader.cjs');
const {writeZip}=require('./zip-writer.cjs');
const excluded=new Set(['logs','crash-reports','.astra-natives','astra-pack.json','astra-skins.json','launcher_accounts.json','accounts.json','integrations.json','.git','.env']);
function portableProfile(input,id=input.id){
 validateProfile({...input,id});
 if(typeof input.name!=='string'||!input.name.trim()||input.name.length>48)throw new Error('Некорректное имя сборки.');
 if(input.loaderVersion && (typeof input.loaderVersion!=='string'||!/^[a-zA-Z0-9._-]{1,64}$/.test(input.loaderVersion)))throw new Error('Некорректная версия загрузчика.');
 return {id,name:input.name.trim(),version:input.version,loader:input.loader,loaderVersion:input.loaderVersion||'',art:['forest','desert','night','snow','cherry','canyon','lagoon','nether','end'].includes(input.art)?input.art:'forest',mods:[],last:'Импортирована'};
}
async function filesIn(root,includeWorlds=true,includeScreens=true){
 const files=[];let total=0;
 async function walk(directory,prefix=''){
 let entries;try{entries=await fs.readdir(directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
 for(const entry of entries){
 const name=prefix+entry.name,parts=name.split('/');
 if(excluded.has(entry.name)||entry.name.endsWith('.log')||(!includeWorlds&&parts[0]==='saves')||(!includeScreens&&parts[0]==='screenshots'))continue;
 safePath(name);if(entry.isSymbolicLink())throw new Error('Ссылки на внешние папки в сборках не поддерживаются.');
 const target=path.join(directory,entry.name);
 if(entry.isDirectory())await walk(target,name+'/');
 else if(entry.isFile()){const info=await fs.stat(target);if(info.size>1024*1024*1024)throw new Error('Файл сборки превышает 1 ГБ.');total+=info.size;if(total>8*1024*1024*1024||files.length>=9998)throw new Error('Сборка слишком большая.');files.push({name,path:target});}
 }
 }
 await walk(root);return files;
}
function createInstanceTools(root,{download,nativeImage,api=modrinthApi}={}){
 let busy=false;
 async function exclusive(work){if(busy)throw new Error('Другая операция со сборкой ещё выполняется.');busy=true;try{return await work();}finally{busy=false;}}
 async function modFile(id,name){
 if(typeof name!=='string'||path.basename(name)!==name||!/^.+\.jar(?:\.disabled)?$/i.test(name))throw new Error('Некорректный файл мода.');
 const file=path.join(instanceFolder(root,id),'mods',name),info=await fs.lstat(file);
 if(!info.isFile()||info.isSymbolicLink())throw new Error('Некорректный файл мода.');return file;
 }
 async function toggle(id,name){return exclusive(async()=>{
 const file=await modFile(id,name),target=/\.disabled$/i.test(name)?file.slice(0,-9):file+'.disabled';
 try{await fs.access(target);throw new Error('В сборке уже есть файл с таким именем.');}catch(error){if(error.code!=='ENOENT')throw error;}
 await fs.rename(file,target);return{path:target,filename:path.basename(target),disabled:/\.disabled$/i.test(target)};
 });}
 async function clone(input,name,includeWorlds=true){return exclusive(async()=>{
 const id=crypto.randomUUID(),profile=portableProfile({...input,name},id),source=instanceFolder(root,input.id),target=instanceFolder(root,id);
 try{
 await fs.mkdir(target,{recursive:true});for(const file of await filesIn(source,includeWorlds,true)){const output=path.join(target,...file.name.split('/'));await fs.mkdir(path.dirname(output),{recursive:true});await fs.copyFile(file.path,output);}

 try{await fs.copyFile(path.join(source,'astra-skins.json'),path.join(target,'astra-skins.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
 await fs.writeFile(path.join(target,'astra-pack.json'),JSON.stringify(profile));return profile;
 }catch(error){await fs.rm(target,{recursive:true,force:true});throw error;}
 });}
 async function exportZip(input,filename,includeWorlds=false){return exclusive(async()=>{
 const profile=portableProfile(input),directory=instanceFolder(root,input.id);
 if(path.resolve(filename).toLowerCase().startsWith((path.resolve(directory)+path.sep).toLowerCase()))throw new Error('Сохрани архив за пределами папки сборки.');
 const files=await filesIn(directory,includeWorlds,false);
 const temp=filename+'.astra-'+crypto.randomUUID()+'.tmp';
 try{await writeZip(temp,[{name:'astra-export.json',bytes:Buffer.from(JSON.stringify({format:'astra-instance-v1',profile}))},...files.map(file=>({...file,name:'instance/'+file.name}))]);await fs.rename(temp,filename);return{files:files.length,path:filename};}finally{await fs.rm(temp,{force:true}).catch(()=>{});}
 });}
 async function importZip(filename){return exclusive(async()=>{
 const zip=await openZip(filename,{maxEntry:1024*1024*1024,maxTotal:8*1024*1024*1024}),id=crypto.randomUUID(),target=instanceFolder(root,id);
 try{
 const manifest=zip.entries.find(entry=>entry.name==='astra-export.json');if(!manifest||manifest.unpacked>100000){if(zip.entries.some(entry=>entry.name==='manifest.json'))throw new Error('CurseForge ZIP содержит список модов для загрузки. Автоматический импорт пока недоступен. Открой CurseForge в каталоге, создай сборку с нужной версией и добавь скачанные моды кнопкой «Добавить файлы».');throw new Error('Это не ZIP-сборка ASTRA. Для импорта нужен ASTRA ZIP или Modrinth .mrpack.');}
 const data=JSON.parse((await zip.read(manifest)).toString('utf8'));if(data.format!=='astra-instance-v1')throw new Error('Неподдерживаемый формат ZIP.');
 const profile=portableProfile(data.profile,id);await fs.mkdir(target,{recursive:true});
 for(const entry of zip.entries){if(entry.isDirectory||entry===manifest)continue;if(!entry.name.startsWith('instance/'))throw new Error('Некорректный путь в ZIP.');const relative=safePath(entry.name.slice(9));if(relative.split('/').some(part=>excluded.has(part)))throw new Error('В архиве найден служебный файл.');const output=path.join(target,...relative.split('/'));await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,await zip.read(entry),{flag:'wx'});}
 await fs.writeFile(path.join(target,'astra-pack.json'),JSON.stringify(profile),{flag:'wx'});return profile;
 }catch(error){await fs.rm(target,{recursive:true,force:true});throw error;}finally{await zip.close();}
 });}
 async function checkUpdates(profile){
 validateProfile(profile);const directory=path.join(instanceFolder(root,profile.id),'mods');
 let entries;try{entries=await fs.readdir(directory);}catch(error){if(error.code==='ENOENT')return{updates:[],checked:0,unmatched:0,disabled:0};throw error;}
 const mods=entries.filter(name=>/\.jar$/i.test(name)), hashes=[];
 if(mods.length>1000)throw new Error('Слишком много модов для проверки.');
 for(const name of mods){const file=await modFile(profile.id,name);hashes.push({filename:name,hash:await hashFile(file,'sha512')});}
 const updates=[];let unmatched=0;
 for(let offset=0;offset<hashes.length;offset+=50){
 const batch=hashes.slice(offset,offset+50), latest=await api('/version_files/update',{hashes:batch.map(item=>item.hash),algorithm:'sha512',loaders:[profile.loader.toLowerCase()],game_versions:[profile.version],version_types:['release']});
 for(const item of batch){const version=latest[item.hash];if(!version){unmatched++;continue;}if(!version.game_versions?.includes(profile.version)||!version.loaders?.includes(profile.loader.toLowerCase()))continue;if(!version.files?.some(file=>file.hashes?.sha512===item.hash))updates.push({...item,projectId:version.project_id,versionId:version.id,name:version.name});}
 }
 return{updates,checked:hashes.length,unmatched,disabled:entries.filter(name=>/\.jar\.disabled$/i.test(name)).length};
 }
 async function update(profile,choice){return exclusive(async()=>{
 validateProfile(profile);const source=await modFile(profile.id,choice?.filename),hash=await hashFile(source,'sha512');
 if(hash!==choice.hash)throw new Error('Файл мода изменился. Проверь обновления заново.');
 const result=await checkUpdates(profile),latest=result.updates.find(item=>item.filename===choice.filename&&item.hash===hash&&item.versionId===choice.versionId);if(!latest)throw new Error('Это обновление больше не доступно. Проверь список заново.');
 const stagingId=crypto.randomUUID(),staging=instanceFolder(root,stagingId),mods=path.join(instanceFolder(root,profile.id),'mods'),backup=mods+'.astra-backup-'+crypto.randomUUID();let moved=false;
 try{
 await fs.mkdir(staging,{recursive:true});await fs.cp(mods,path.join(staging,'mods'),{recursive:true,errorOnExist:true,force:false});await fs.rm(path.join(staging,'mods',latest.filename));
 await download({source:'modrinth',kind:'mods',id:latest.projectId,versionId:latest.versionId,profileId:stagingId,gameVersion:profile.version,loader:profile.loader.toLowerCase()});
 await fs.rename(mods,backup);moved=true;
 try{await fs.rename(path.join(staging,'mods'),mods);}catch(error){await fs.rename(backup,mods);moved=false;throw error;}
 await fs.rm(backup,{recursive:true,force:true});moved=false;return true;
 }finally{await fs.rm(staging,{recursive:true,force:true}).catch(()=>{});if(moved)await fs.rename(backup,mods).catch(()=>{});}
 });}
 async function screenshots(id){
 const directory=path.join(instanceFolder(root,id),'screenshots');let entries;try{entries=await fs.readdir(directory,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return[];throw error;}
 const results=[];for(const entry of entries){if(!entry.isFile()||!entry.name.toLowerCase().endsWith('.png'))continue;const info=await fs.stat(path.join(directory,entry.name));results.push({name:entry.name,size:info.size,time:info.mtimeMs});if(results.length>=1000)break;}return results.sort((a,b)=>b.time-a.time);
 }
 async function screenshotFile(id,name){if(typeof name!=='string'||path.basename(name)!==name||!name.toLowerCase().endsWith('.png'))throw new Error('Некорректный скриншот.');const file=path.join(instanceFolder(root,id),'screenshots',name),info=await fs.lstat(file);if(!info.isFile()||info.isSymbolicLink())throw new Error('Некорректный скриншот.');return file;}
 async function thumbnail(id,name){const file=await screenshotFile(id,name);if((await fs.stat(file)).size>32*1024*1024)return null;const image=nativeImage.createFromBuffer(await fs.readFile(file));return image.isEmpty()?null:image.resize({width:360}).toDataURL();}
 return{toggle,clone,exportZip,importZip,checkUpdates,update,screenshots,screenshotFile,thumbnail,isBusy:()=>busy};
}
async function modrinthApi(route,body){const response=await fetch('https://api.modrinth.com/v2'+route,{method:'POST',headers:{'Content-Type':'application/json','User-Agent':'AstraLauncher'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`Modrinth: ${response.status}`);return response.json();}
module.exports={createInstanceTools,filesIn,portableProfile};
