const networkKeys = ['servers','intro','add','refresh','empty','name','address','save','edit','remove','copy','online','offline','checking','skins','front','back','skin','cape','clear','source','local','official','model','classic','slim','install','instance','hint','noSkin','removeQuestion','done','copied','auto'];
const networkCopy = {
 ru:['Серверы','Избранные серверы Minecraft Java: статус, игроки и пинг.','Добавить сервер','Обновить','Добавь адрес сервера, чтобы видеть его статус.','Название','Адрес сервера','Сохранить','Изменить','Удалить','Копировать адрес','Онлайн','Недоступен','Проверяем…','Скин и плащ','Спереди','Сзади','Выбрать скин','Выбрать плащ','Сбросить','Источник скина','Локальные PNG','Minecraft / Mojang','Модель','Классическая','Тонкие руки','Установить CustomSkinLoader','Сборка','PNG: скин 64×64 или 64×32, плащ 64×32. Для отображения в игре установи CustomSkinLoader в выбранную сборку. Скин видят игроки с совместимой системой скинов.','Скин не найден. Выбери PNG или другой источник.','Удалить сервер из избранного?','Поддержка скинов установлена в сборку.','Адрес скопирован','Обновляется раз в минуту, пока открыта эта страница.'],
 en:['Servers','Favourite Minecraft Java servers: status, players and ping.','Add server','Refresh','Add a server address to see its status.','Name','Server address','Save','Edit','Remove','Copy address','Online','Unavailable','Checking…','Skin and cape','Front','Back','Choose skin','Choose cape','Reset','Skin source','Local PNG files','Minecraft / Mojang','Model','Classic','Slim arms','Install CustomSkinLoader','Instance','PNG: skin 64×64 or 64×32, cape 64×32. Install CustomSkinLoader in the selected instance to use them in game. Players need a compatible skin system to see your skin.','No skin found. Choose a PNG or another source.','Remove this favourite server?','Skin support installed in the instance.','Address copied','Refreshes every minute while this page is open.'],
 de:['Server','Minecraft-Java-Favoriten: Status, Spieler und Ping.','Server hinzufügen','Aktualisieren','Füge eine Serveradresse hinzu, um den Status zu sehen.','Name','Serveradresse','Speichern','Bearbeiten','Entfernen','Adresse kopieren','Online','Nicht erreichbar','Wird geprüft…','Skin und Umhang','Vorne','Hinten','Skin wählen','Umhang wählen','Zurücksetzen','Skin-Quelle','Lokale PNG-Dateien','Minecraft / Mojang','Modell','Klassisch','Schmale Arme','CustomSkinLoader installieren','Instanz','PNG: Skin 64×64 oder 64×32, Umhang 64×32. Installiere CustomSkinLoader in der gewählten Instanz. Andere Spieler benötigen ein kompatibles Skin-System.','Kein Skin gefunden. Wähle eine PNG-Datei oder andere Quelle.','Diesen Server aus den Favoriten entfernen?','Skin-Unterstützung in der Instanz installiert.','Adresse kopiert','Wird jede Minute aktualisiert, solange diese Seite geöffnet ist.'],
 fr:['Serveurs','Serveurs favoris Minecraft Java : état, joueurs et ping.','Ajouter un serveur','Actualiser','Ajoutez une adresse de serveur pour voir son état.','Nom','Adresse du serveur','Enregistrer','Modifier','Retirer','Copier l’adresse','En ligne','Indisponible','Vérification…','Skin et cape','Face','Dos','Choisir un skin','Choisir une cape','Réinitialiser','Source du skin','Fichiers PNG locaux','Minecraft / Mojang','Modèle','Classique','Bras fins','Installer CustomSkinLoader','Instance','PNG : skin 64×64 ou 64×32, cape 64×32. Installez CustomSkinLoader dans l’instance choisie. Les autres joueurs doivent utiliser un système de skins compatible.','Aucun skin trouvé. Choisissez un PNG ou une autre source.','Retirer ce serveur des favoris ?','Prise en charge des skins installée dans l’instance.','Adresse copiée','Actualisation chaque minute tant que cette page est ouverte.'],
 es:['Servidores','Servidores favoritos de Minecraft Java: estado, jugadores y ping.','Añadir servidor','Actualizar','Añade una dirección de servidor para ver su estado.','Nombre','Dirección del servidor','Guardar','Editar','Eliminar','Copiar dirección','En línea','No disponible','Comprobando…','Skin y capa','Frente','Espalda','Elegir skin','Elegir capa','Restablecer','Origen de la skin','Archivos PNG locales','Minecraft / Mojang','Modelo','Clásico','Brazos delgados','Instalar CustomSkinLoader','Instancia','PNG: skin de 64×64 o 64×32, capa de 64×32. Instala CustomSkinLoader en la instancia elegida. Los demás jugadores necesitan un sistema de skins compatible.','No se encontró ninguna skin. Elige un PNG u otro origen.','¿Eliminar este servidor de favoritos?','Soporte de skins instalado en la instancia.','Dirección copiada','Se actualiza cada minuto mientras esta página está abierta.'],
 ko:['서버','즐겨찾는 Minecraft Java 서버의 상태, 플레이어 수, 핑입니다.','서버 추가','새로 고침','서버 주소를 추가하면 상태를 볼 수 있습니다.','이름','서버 주소','저장','수정','삭제','주소 복사','온라인','연결할 수 없음','확인 중…','스킨과 망토','앞면','뒷면','스킨 선택','망토 선택','초기화','스킨 소스','로컬 PNG 파일','Minecraft / Mojang','모델','기본','가는 팔','CustomSkinLoader 설치','인스턴스','PNG: 스킨은 64×64 또는 64×32, 망토는 64×32입니다. 선택한 인스턴스에 CustomSkinLoader를 설치하세요. 다른 플레이어도 호환되는 스킨 시스템이 필요합니다.','스킨이 없습니다. PNG 또는 다른 소스를 선택하세요.','즐겨찾기에서 이 서버를 삭제할까요?','인스턴스에 스킨 지원을 설치했습니다.','주소를 복사했습니다','이 페이지가 열려 있는 동안 1분마다 갱신합니다.'],
 ja:['サーバー','お気に入りの Minecraft Java サーバーの状態、人数、ping。','サーバーを追加','更新','サーバーのアドレスを追加すると状態を確認できます。','名前','サーバーのアドレス','保存','編集','削除','アドレスをコピー','オンライン','接続できません','確認中…','スキンとマント','正面','背面','スキンを選択','マントを選択','リセット','スキンの取得元','ローカル PNG','Minecraft / Mojang','モデル','通常','細い腕','CustomSkinLoader をインストール','構成','PNG：スキンは64×64または64×32、マントは64×32です。選んだ構成にCustomSkinLoaderをインストールしてください。他のプレイヤーにも対応したスキンシステムが必要です。','スキンがありません。PNGか別の取得元を選んでください。','このサーバーをお気に入りから削除しますか？','構成にスキン機能をインストールしました。','アドレスをコピーしました','このページを開いている間、毎分更新します。'],
 'zh-CN':['服务器','Minecraft Java 收藏服务器：状态、玩家人数和延迟。','添加服务器','刷新','添加服务器地址以查看状态。','名称','服务器地址','保存','编辑','移除','复制地址','在线','无法连接','正在检查…','皮肤与披风','正面','背面','选择皮肤','选择披风','重置','皮肤来源','本地 PNG 文件','Minecraft / Mojang','模型','经典','纤细手臂','安装 CustomSkinLoader','整合包','PNG：皮肤为64×64或64×32，披风为64×32。请在所选整合包中安装CustomSkinLoader。其他玩家需要兼容的皮肤系统才能看到你的皮肤。','未找到皮肤。请选择PNG或其他来源。','从收藏中移除此服务器？','已在整合包中安装皮肤支持。','已复制地址','打开此页面时，每分钟刷新一次。'],
 'zh-TW':['伺服器','Minecraft Java 收藏伺服器：狀態、玩家人數和延遲。','新增伺服器','重新整理','新增伺服器位址以查看狀態。','名稱','伺服器位址','儲存','編輯','移除','複製位址','上線','無法連線','正在檢查…','外觀與披風','正面','背面','選擇外觀','選擇披風','重設','外觀來源','本機 PNG 檔案','Minecraft / Mojang','模型','經典','纖細手臂','安裝 CustomSkinLoader','整合包','PNG：外觀為64×64或64×32，披風為64×32。請在所選整合包中安裝CustomSkinLoader。其他玩家需要相容的外觀系統才能看到你的外觀。','找不到外觀。請選擇PNG或其他來源。','從收藏中移除此伺服器？','已在整合包中安裝外觀支援。','已複製位址','開啟此頁面時，每分鐘更新一次。'],
 ar:['الخوادم','خوادم Minecraft Java المفضلة: الحالة واللاعبون وزمن الاستجابة.','إضافة خادم','تحديث','أضف عنوان خادم لعرض حالته.','الاسم','عنوان الخادم','حفظ','تعديل','إزالة','نسخ العنوان','متصل','غير متاح','جارٍ التحقق…','المظهر والعباءة','الأمام','الخلف','اختيار مظهر','اختيار عباءة','إعادة تعيين','مصدر المظهر','ملفات PNG محلية','Minecraft / Mojang','النموذج','كلاسيكي','ذراعان نحيفتان','تثبيت CustomSkinLoader','التجميعة','PNG: المظهر 64×64 أو 64×32، والعباءة 64×32. ثبّت CustomSkinLoader في التجميعة المختارة. يحتاج اللاعبون الآخرون إلى نظام مظاهر متوافق لرؤية مظهرك.','لم يُعثر على مظهر. اختر PNG أو مصدرًا آخر.','إزالة هذا الخادم من المفضلة؟','تم تثبيت دعم المظاهر في التجميعة.','تم نسخ العنوان','يُحدّث كل دقيقة أثناء فتح هذه الصفحة.'],
 nb:['Servere','Favorittservere for Minecraft Java: status, spillere og ping.','Legg til server','Oppdater','Legg til en serveradresse for å se statusen.','Navn','Serveradresse','Lagre','Rediger','Fjern','Kopier adresse','På nett','Utilgjengelig','Sjekker…','Skin og kappe','Foran','Bak','Velg skin','Velg kappe','Tilbakestill','Skin-kilde','Lokale PNG-filer','Minecraft / Mojang','Modell','Klassisk','Smale armer','Installer CustomSkinLoader','Instans','PNG: skin 64×64 eller 64×32, kappe 64×32. Installer CustomSkinLoader i den valgte instansen. Andre spillere trenger et kompatibelt skin-system.','Fant ikke skin. Velg en PNG-fil eller en annen kilde.','Fjerne denne serveren fra favorittene?','Skin-støtte installert i instansen.','Adresse kopiert','Oppdateres hvert minutt mens denne siden er åpen.'],
};
networkCopy['de-CH']=networkCopy.de;
function networkText(key) { return (networkCopy[currentLanguage()] || networkCopy.en)[networkKeys.indexOf(key)] || key; }
icons.server='<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 7h.01M7 18h.01M12 7h5M12 18h5"/>';
if (!Array.isArray(state.servers)) state.servers=[];
const serverResults=new Map();
let serversRefreshing=false, skinInfo={source:'local',model:'classic',skin:null,cape:null}, skinView='front', skinRequest=0;
function serversPage() {
 return `<section class="page-intro"><div><div class="eyebrow">MINECRAFT JAVA</div><h1>${networkText('servers')}</h1><p>${networkText('intro')}</p></div><div class="network-actions"><button class="button secondary" data-server-refresh ${serversRefreshing?'disabled':''}>${networkText('refresh')}</button><button class="button light" data-server-add>${networkText('add')}</button></div></section><div class="server-list">${state.servers.map(server=>{
 const result=serverResults.get(server.id), online=result?.online;
 return `<article class="server-card"><span class="server-symbol ${online?'online':''}">${icon('server')}</span><div class="server-detail"><h2>${esc(server.name)}</h2><small dir="ltr">${esc(server.address)}</small><p class="server-motd">${esc(result?.motd || '')}</p><div class="server-meta"><span class="${online?'online-text':''}">${result?networkText(online?'online':'offline'):networkText('checking')}</span>${online?`<span>${result.players} / ${result.maxPlayers}</span><span>${result.ping===null?'—':result.ping+' ms'}</span><span>${esc(result.version)}</span>`:''}</div></div><div class="network-actions"><button class="button secondary" data-server-copy="${esc(server.id)}">${networkText('copy')}</button><button class="icon-button" data-server-edit="${esc(server.id)}" aria-label="${networkText('edit')}" title="${networkText('edit')}">${icon('settings')}</button><button class="icon-button" data-server-remove="${esc(server.id)}" aria-label="${networkText('remove')}" title="${networkText('remove')}">${icon('close')}</button></div></article>`;
 }).join('') || `<div class="designed-empty">${icon('server')}<p>${networkText('empty')}</p></div>`}</div><p class="network-note">${networkText('auto')}</p>`;
}
function serverModal(id) {
 const server=state.servers.find(item=>item.id===id);
 showModal(`<h2>${networkText(server?'edit':'add')}</h2><form id="server-form" data-id="${esc(id||'')}"><label>${networkText('name')}<input name="name" value="${esc(server?.name||'')}" required maxlength="48" autofocus></label><label>${networkText('address')}<input name="address" value="${esc(server?.address||'')}" placeholder="play.example.com:25565" dir="ltr" required maxlength="255"></label><p id="server-form-error" role="alert"></p><button class="button light full">${networkText('save')}</button></form>`);
}
async function refreshServers() {
 if(serversRefreshing || !window.astraDesktop)return;
 serversRefreshing=true;if(page==='servers')render();
 const list=[...state.servers];let cursor=0;
 await Promise.all(Array.from({length:Math.min(3,list.length)},async()=>{
   while(cursor<list.length){const server=list[cursor++];try{const result=await window.astraDesktop.serverStatus(server.address);if(state.servers.some(item=>item.id===server.id&&item.address===server.address))serverResults.set(server.id,result);}catch{serverResults.set(server.id,{online:false});}if(page==='servers')render();}
 }));
 serversRefreshing=false;if(page==='servers')render();
}
const originalAccountsNetwork=accountsPage;
accountsPage=function(){
 const packs=state.packs.filter(pack=>pack.loader!=='Vanilla');
 return originalAccountsNetwork()+`<section class="skin-panel"><div class="skin-stage"><h2>${networkText('skins')}</h2><canvas id="player-skin-canvas" width="220" height="340" role="img" aria-label="${networkText('skins')}"></canvas><p id="skin-preview-message" role="status">${skinInfo.skin?'':networkText('noSkin')}</p><div class="network-actions"><button class="button secondary" data-skin-view="front" aria-pressed="${skinView==='front'}">${networkText('front')}</button><button class="button secondary" data-skin-view="back" aria-pressed="${skinView==='back'}">${networkText('back')}</button></div></div><div class="skin-controls"><label>${networkText('source')}<select id="skin-source"><option value="local" ${skinInfo.source==='local'?'selected':''}>${networkText('local')}</option><option value="ely" ${skinInfo.source==='ely'?'selected':''}>Ely.by</option><option value="mojang" ${skinInfo.source==='mojang'?'selected':''}>${networkText('official')}</option></select></label><label>${networkText('model')}<select id="skin-model"><option value="classic" ${skinInfo.model!=='slim'?'selected':''}>${networkText('classic')}</option><option value="slim" ${skinInfo.model==='slim'?'selected':''}>${networkText('slim')}</option></select></label><div class="network-actions"><button class="button secondary" data-skin-import="skin">${networkText('skin')}</button><button class="button secondary" data-skin-import="cape">${networkText('cape')}</button><button class="text-button" data-skin-clear="skin">${networkText('clear')} · ${networkText('skin')}</button><button class="text-button" data-skin-clear="cape">${networkText('clear')} · ${networkText('cape')}</button></div><p class="network-note">${networkText('hint')}</p><label>${networkText('instance')}<select id="skin-instance">${packs.map(pack=>`<option value="${esc(pack.id)}">${esc(pack.name)} · ${esc(pack.loader)} ${esc(pack.version)}</option>`).join('')}</select></label><button class="button light" data-skin-install ${packs.length?'':'disabled'}>${networkText('install')}</button><p id="skin-operation-status" role="status"></p></div></section>`;
};
function skinPlayerName(){return state.accountMode==='microsoft'&&integrationStatus.microsoftAccount?integrationStatus.microsoftAccount:state.profile;}
async function refreshSkin() {
 const request=++skinRequest;
 try{const info=await window.astraDesktop.playerSkinPreview(skinPlayerName());if(request!==skinRequest)return;skinInfo=info;if(page==='accounts')render();}
 catch(error){if(request===skinRequest&&page==='accounts') {const message=$('#skin-preview-message');if(message)message.textContent=humanError(error);}}
}
async function drawSkin() {
 const canvas=$('#player-skin-canvas');if(!canvas)return;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const load=source=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=source;});
 const scale=8, baseX=46,baseY=35,back=skinView==='back';
 const draw=(image,sx,sy,w,h,x,y,dw=w)=>ctx.drawImage(image,sx,sy,w,h,baseX+x*scale,baseY+y*scale,dw*scale,h*scale);
 try{
 const cape=skinInfo.cape?await load(skinInfo.cape):null, image=skinInfo.skin?await load(skinInfo.skin):null;
 if(!canvas.isConnected)return;
 if(back&&cape)draw(cape,12,1,10,16,3,8);
 if(!image){ctx.fillStyle='#9f91c8';ctx.fillRect(baseX+32,baseY,64,64);ctx.fillStyle='#655b87';ctx.fillRect(baseX,baseY+64,128,96);ctx.fillRect(baseX+32,baseY+160,64,96);if(back&&cape)draw(cape,12,1,10,16,3,8);return;}
 draw(image,back?24:8,8,8,8,4,0);draw(image,back?56:40,8,8,8,4,0);
 draw(image,back?32:20,20,8,12,4,8);if(image.height===64)draw(image,back?32:20,36,8,12,4,8);
 const slim=skinInfo.model==='slim', arm=slim?3:4;
 draw(image,back?(slim?51:52):44,20,arm,12,4-arm,8);
 if(image.height===64){draw(image,back?(slim?43:44):36,52,arm,12,12,8);draw(image,back?(slim?51:52):44,36,arm,12,4-arm,8);draw(image,back?(slim?59:60):52,52,arm,12,12,8);}else draw(image,back?52:44,20,4,12,12,8);
 draw(image,back?12:4,20,4,12,4,20);
 if(image.height===64){draw(image,back?28:20,52,4,12,8,20);draw(image,back?12:4,36,4,12,4,20);draw(image,back?12:4,52,4,12,8,20);}else draw(image,back?12:4,20,4,12,8,20);
 if(back&&cape)draw(cape,12,1,10,16,3,8);
 }catch{const message=$('#skin-preview-message');if(message)message.textContent=networkText('noSkin');}
}
const renderBeforeNetwork=render;
let lastNetworkPage='';
render=function(){renderBeforeNetwork();if(page==='accounts')drawSkin();if(page!==lastNetworkPage){lastNetworkPage=page;if(page==='servers')queueMicrotask(refreshServers);if(page==='accounts')queueMicrotask(refreshSkin);}};
document.addEventListener('submit',async event=>{
 if(event.target.id!=='server-form')return;
 event.preventDefault();const form=event.target, data=new FormData(form), address=String(data.get('address')).trim(), name=String(data.get('name')).trim();
 const button=form.querySelector('button');button.disabled=true;
 try{await window.astraDesktop.validateServer(address);if(!name)throw new Error(networkText('name'));const existing=state.servers.find(item=>item.id===form.dataset.id);if(state.servers.some(item=>item!==existing&&item.address.toLowerCase()===address.toLowerCase()))throw new Error(address);if(!existing&&state.servers.length>=50)throw new Error('Maximum: 50');if(existing){existing.name=name;existing.address=address;serverResults.delete(existing.id);}else state.servers.push({id:crypto.randomUUID(),name,address});save();modal.close();go('servers');refreshServers();}catch(error){form.querySelector('[role=alert]').textContent=humanError(error);}finally{button.disabled=false;}
});
document.addEventListener('click',async event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.hasAttribute('data-server-add'))return serverModal();
 if(button.hasAttribute('data-server-edit'))return serverModal(button.dataset.serverEdit);
 if(button.hasAttribute('data-server-refresh'))return refreshServers();
 if(button.hasAttribute('data-server-remove')){const id=button.dataset.serverRemove;showModal(`<h2>${networkText('removeQuestion')}</h2><button class="button light full" data-server-confirm-remove="${esc(id)}">${networkText('remove')}</button>`);return;}
 if(button.hasAttribute('data-server-confirm-remove')){state.servers=state.servers.filter(item=>item.id!==button.dataset.serverConfirmRemove);save();modal.close();render();return;}
 if(button.hasAttribute('data-server-copy')){const server=state.servers.find(item=>item.id===button.dataset.serverCopy);try{await navigator.clipboard.writeText(server.address);toast(networkText('copied'));}catch(error){toast(humanError(error));}return;}
 if(button.hasAttribute('data-skin-view')){skinView=button.dataset.skinView;render();return;}
 const action=['skinImport','skinClear','skinInstall'].find(key=>key in button.dataset);if(!action)return;
 const pack=state.packs.find(item=>item.id===$('#skin-instance')?.value);
 button.disabled=true;
 try{
 if(action==='skinImport'){const result=await window.astraDesktop.selectPlayerTexture(button.dataset.skinImport);if(!result)return;skinInfo=result;skinRequest++;render();}
 if(action==='skinClear'){skinInfo=await window.astraDesktop.removePlayerTexture(button.dataset.skinClear);skinRequest++;render();refreshSkin();}
 if(action==='skinInstall'){const result=await window.astraDesktop.installPlayerSkins({id:pack.id,loader:pack.loader,version:pack.version},skinPlayerName());rememberDownloads([{...result,name:'CustomSkinLoader',source:'modrinth'},...(result.installedDependencies||[])]);await refreshInstalled(pack.id);toast(networkText('done'));}
 }catch(error){toast(humanError(error));const message=$('#skin-operation-status');if(message)message.textContent=humanError(error);}finally{if(button.isConnected)button.disabled=false;}
});
document.addEventListener('change',async event=>{
 if(!['skin-source','skin-model'].includes(event.target.id))return;
 try{skinInfo=await window.astraDesktop.playerSkinSource($('#skin-source').value,$('#skin-model').value);skinRequest++;render();refreshSkin();}catch(error){toast(humanError(error));}
});
document.addEventListener('submit',event=>{if(event.target.id==='account-form')queueMicrotask(refreshSkin);});
setInterval(()=>{if(page==='servers'&&!document.hidden)refreshServers();},60000);
window.astraDesktop?.playerSkinStatus?.().then(info=>{skinInfo=info;if(page==='accounts')refreshSkin();}).catch(error=>console.warn('Skin status unavailable:',error));
render();
