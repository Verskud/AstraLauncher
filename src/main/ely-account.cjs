const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {safeStorage,app}=require('electron');
const {withDownloadResponse}=require('./download-response.cjs');
function createElyAccount(root,{storage=safeStorage,request=elyRequest}={}){
 const filename=path.join(root,'ely-account.json');let generation=0,refreshing=null,pending=null;
 async function read(){try{return JSON.parse(await fs.readFile(filename,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw new Error('Не удалось прочитать аккаунт Ely.by. Войди заново.');}}
 const decode=data=>{if(!storage.isEncryptionAvailable())throw new Error('Системное шифрование недоступно.');return JSON.parse(storage.decryptString(Buffer.from(data.credentials,'base64')));};
 async function save(data,expected){
  if(expected!==generation)throw new Error('Вход отменён.');
  const profile=data.selectedProfile;
  if(!profile||!/^[a-f\d]{32}$/i.test(profile.id)||!/^[a-zA-Z0-9_]{1,16}$/.test(profile.name)||typeof data.accessToken!=='string'||!data.accessToken||typeof data.clientToken!=='string')throw new Error('Ely.by вернул некорректный профиль.');
  if(!storage.isEncryptionAvailable())throw new Error('Системное шифрование недоступно. Вход не сохранён.');
  const credentials=storage.encryptString(JSON.stringify({accessToken:data.accessToken,clientToken:data.clientToken})).toString('base64');
  await fs.mkdir(root,{recursive:true});await fs.writeFile(filename,JSON.stringify({name:profile.name,uuid:profile.id,credentials}),{mode:0o600});
  if(expected!==generation){await fs.rm(filename,{force:true});throw new Error('Вход отменён.');}
  return {name:profile.name,uuid:profile.id,token:data.accessToken,userType:'mojang'};
 }
 async function status(){const data=await read();return data?{connected:true,name:data.name,uuid:data.uuid}:{connected:false};}
 async function signIn({username,password,totp}={}){
  if(pending||refreshing)throw new Error('Дождись завершения входа.');
  if(typeof username!=='string'||!username.trim()||username.length>254||typeof password!=='string'||!password||password.length>1024||totp&&!/^\d{6}$/.test(totp))throw new Error('Проверь email, пароль и код 2FA.');
  if(!storage.isEncryptionAvailable())throw new Error('Системное шифрование недоступно.');
  const epoch=++generation;pending=new AbortController();
  try{const result=await request('/auth/authenticate',{username:username.trim(),password:totp?password+':'+totp:password,clientToken:crypto.randomUUID(),requestUser:true},pending.signal);await save(result,epoch);return status();}
  finally{pending=null;}
 }
 async function account(){
  if(refreshing)return refreshing;
  const epoch=generation;
  refreshing=(async()=>{const data=await read();if(!data)throw new Error('Сначала войди в аккаунт Ely.by.');const credentials=decode(data);const result=await request('/auth/refresh',{...credentials,requestUser:true});return save(result,epoch);})().finally(()=>{refreshing=null;});return refreshing;
 }
 function cancel(){generation++;pending?.abort();}
 async function disconnect(){
  cancel();const data=await read();await fs.rm(filename,{force:true});
  if(data){try{await request('/auth/invalidate',decode(data));}catch{/* Local logout is complete even if the service is unreachable. */}}
  return {connected:false};
 }
 return{status,signIn,account,cancel,disconnect};
}
async function elyRequest(route,body,signal){
 const response=await fetch('https://authserver.ely.by'+route,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','User-Agent':'AstraLauncher'},body:JSON.stringify(body),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
 const text=await response.text();let data;try{data=text?JSON.parse(text):{};}catch{throw new Error('Ely.by вернул некорректный ответ.');}
 if(!response.ok){if(data.errorMessage==='Account protected with two factor auth.')throw new Error('ELY_2FA');if(route==='/auth/refresh'&&[400,401].includes(response.status))throw new Error('Сессия Ely.by истекла. Войди в аккаунт заново.');if(response.status===401||response.status===400)throw new Error('Не удалось войти в Ely.by. Проверь email, пароль или код 2FA.');throw new Error(`Ely.by недоступен (${response.status}).`);}return data;
}
async function injector(root){
 const metadata=await withDownloadResponse('https://authlib-injector.yushi.moe/artifact/latest.json',{},async response=>{if(!response.ok)throw new Error('Не удалось получить authlib-injector.');return response.json();});
 const url=new URL(metadata.download_url),hash=metadata.checksums?.sha256;
 if(url.protocol!=='https:'||url.hostname!=='authlib-injector.yushi.moe'||url.port||url.username||url.password||!/^\/artifact\/\d+\/[a-zA-Z0-9._-]+\.jar$/.test(url.pathname)||!/^[a-f\d]{64}$/i.test(hash||''))throw new Error('Некорректное описание authlib-injector.');
 const output=path.join(root,'authlib-injector',hash+'.jar');
 try{if(crypto.createHash('sha256').update(await fs.readFile(output)).digest('hex')===hash)return output;}catch(error){if(error.code!=='ENOENT')throw error;}
 const bytes=await withDownloadResponse(url, {redirect:'error'},async(response,touch)=>{if(!response.ok)throw new Error('Не удалось загрузить authlib-injector.');const chunks=[];let size=0;for await(const chunk of response.body){touch();size+=chunk.length;if(size>10*1024*1024)throw new Error('Некорректный размер authlib-injector.');chunks.push(Buffer.from(chunk));}return Buffer.concat(chunks);});
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==hash)throw new Error('Контрольная сумма authlib-injector не совпала.');
 await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,bytes,{mode:0o600});return output;
}
let singleton;
function current(){return singleton||=createElyAccount(app.getPath('userData'));}
module.exports={createElyAccount,current,injector};
