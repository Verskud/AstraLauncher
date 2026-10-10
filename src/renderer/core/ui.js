const $ = (q) => document.querySelector(q);
const icons = {
 compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 cube:'<path d="m12 3 9 5-9 5-9-5 9-5Z M3 8v9l9 5 9-5V8 M12 13v9"/>',
 settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor"/><circle cx="15" cy="17" r="3" fill="currentColor"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
 bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 down:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 play:'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 back:'<path d="M19 12H5m5-5-5 5 5 5"/>',
 folder:'<path d="M3 6h7l2 3h9v11H3Z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
const icon=(name)=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.cube}</svg>`;
const esc=(s)=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3600)}
const coverTemplates = [
 ['forest','Тихий лес'],['desert','Тёплая долина'],['night','Сумерки'],
 ['snow','Снежные вершины'],['cherry','Цветущая роща'],['canyon','Красный каньон'],
 ['lagoon','Тихая лагуна'],['nether','Багровый мир'],['end','Звёздный край'],
];
function coverPicker(selected='forest', gradientId='cover-preview-art'){
 const choice=coverTemplates.some(([id])=>id===selected)?selected:'forest';
 return `<label>Обложка<select name="art">${coverTemplates.map(([id,label])=>`<option value="${id}" ${choice===id?'selected':''}>${label}</option>`).join('')}</select></label><div class="cover-preview">${art(choice,gradientId)}</div>`;
}
function art(kind='forest',id='scene'){
 const scenes={
  snow:{sky:['#8aa9b7','#d9e6e9'],far:'#768d9c',near:'#e7eff0',detail:'<path d="M0 260 200 92l90 105 100-120 170 163 110-92 230 190v70H0Z" fill="#eef5f5"/><path d="m200 92 48 56-48-13-37 13Zm190-15 61 59-60-17-44 15Zm280 71 44 48-43-14-35 17Z" fill="#fff"/><path d="M0 307q225-28 450 0t450-4v47H0Z" fill="#b7ced4"/>'},
  cherry:{sky:['#d8a9b8','#f5d9c8'],far:'#947b9a',near:'#74677c',detail:'<path d="M0 283q220-82 450-16t450-13v96H0Z" fill="#8c8e84"/><path d="M170 305V169m350 132V130m190 183V201" stroke="#594b61" stroke-width="17"/><circle cx="170" cy="168" r="77" fill="#df93ac"/><circle cx="520" cy="133" r="95" fill="#e7a6bc"/><circle cx="710" cy="192" r="67" fill="#d58ba9"/><circle cx="135" cy="145" r="27" fill="#f4bdce" opacity=".7"/><circle cx="558" cy="100" r="36" fill="#f5c3d0" opacity=".6"/>'},
  canyon:{sky:['#b66c57','#edbd80'],far:'#87534e',near:'#743f38',detail:'<path d="M0 236h129v-81h128v93h93v-37h129v-93h117v120h82v-55h116v66h106v101H0Z" fill="#a45c48"/><path d="M0 295h205v-54h164v28h179v-36h116v60h236v57H0Z" fill="#693b3a"/><path d="M129 170h128m222-36h117m82 66h116" stroke="#df9a70" stroke-width="9" opacity=".6"/>'},
  lagoon:{sky:['#5c9ba9','#b3d6ca'],far:'#477e8c',near:'#255c65',detail:'<path d="M0 244q130-70 260-10t260 4q155-76 380 10v102H0Z" fill="#347e85"/><path d="M0 284q190-35 360 0t320-6q115-24 220 10v62H0Z" fill="#2d6876"/><path d="M60 324q150-18 300 0m270-8q110-15 220 0" fill="none" stroke="#b5dbcc" stroke-width="8" opacity=".55"/><path d="M112 249v-102m-18 22q18-42 55-26m-47 28q-30-39-53-20m638 110V138m-8 27q26-42 60-28m-51 29q-31-39-58-24" stroke="#253f48" stroke-width="10" fill="none"/>'},
  nether:{sky:['#321720','#6c2d35'],far:'#52202a',near:'#2b1823',detail:'<path d="M0 264h75V118h47v146h80V79h62v185h89V142h55v122h94V94h54v170h94V137h69v127h82V86h57v178h42v86H0Z" fill="#341a26"/><path d="M0 292q170-20 292 5t300-10q174-17 308 5v58H0Z" fill="#ba453d"/><path d="M0 316q200-13 450 0t450-3" stroke="#f6844d" stroke-width="12" fill="none" opacity=".7"/><path d="M89 121h23m112-43h27m250 18h45m224-9h34" stroke="#9d4c52" stroke-width="10"/>'},
  end:{sky:['#18172e','#493760'],far:'#393650',near:'#28263e',detail:'<path d="M0 252h151v-28h139v26h90v-45h122v32h139v-20h107v35h152v98H0Z" fill="#82759d"/><path d="M90 250V91h27v159m127 0V61h31v189m250 0V82h29v168m183 0V112h25v138" stroke="#231e32" stroke-width="24"/><path d="M70 90h67m91-29h61m221 21h59m154 30h53" stroke="#3d334c" stroke-width="20"/><circle cx="156" cy="81" r="3" fill="#e7d5f5"/><circle cx="427" cy="55" r="4" fill="#e7d5f5"/><circle cx="695" cy="70" r="3" fill="#e7d5f5"/><circle cx="806" cy="123" r="4" fill="#e7d5f5"/>'},
 };
 if(scenes[kind]){
  const scene=scenes[kind];
  return `<svg class="landscape" viewBox="0 0 900 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky-${id}" x2="0" y2="1"><stop stop-color="${scene.sky[0]}"/><stop offset="1" stop-color="${scene.sky[1]}"/></linearGradient></defs><rect width="900" height="350" fill="url(#sky-${id})"/><circle cx="760" cy="65" r="36" fill="#fff2d8" opacity=".68"/><path d="M0 250 140 150l130 100 210-137 160 137 130-83 130 83v100H0Z" fill="${scene.far}" opacity=".66"/><path d="M0 304q230-92 470-30t430-20v96H0Z" fill="${scene.near}"/>${scene.detail}</svg>`;
 }
 const colors=kind==='desert'?['#b49a84','#877c70','#514d43','#b4946b','#795f43']:kind==='night'?['#655778','#393d56','#282f43','#626176','#464354']:['#a4b9b3','#6e9292','#34595b','#829a73','#455f45'];
 let trees='';for(let i=0;i<16;i++){let x=300+i*39,y=140+(i%5)*18;trees+=`<g transform="translate(${x} ${y})"><path d="M0 0h12v58H0Z" fill="#344b42"/><path d="M-15 0h40v20h12v19h-62V20h10Z" fill="${i%2?'#435f51':'#526e58'}"/></g>`}
 return `<svg class="landscape" viewBox="0 0 900 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky-${id}" x2="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="900" height="350" fill="url(#sky-${id})"/><path d="M0 140h65v-25h55v30h60v-50h65v-30h55v30h70v38h60v-60h50v-30h45v35h55v65h70v-34h75v-50h50v50h55v30h80v217H0Z" fill="${colors[2]}" opacity=".38"/><path d="M0 225h90v-35h90v20h90v-45h80v25h80v-50h70v25h70v-20h85v30h70v-50h90v25h85v200H0Z" fill="${colors[2]}" opacity=".7"/>${kind==='forest'?trees:''}<path d="M0 240h130v30h130v30h180v-25h95v-35h100v-50h70v-28h115v35h80v153H0Z" fill="${colors[3]}"/><path d="M0 265h130v30h130v30h180v-25h95v-35h100v-50h70v-28h115v35h80v128H0Z" fill="${colors[4]}"/><path d="M345 350v-22h100v-20h95v-27h85v-26h40v95Z" fill="#8eb4b5" opacity=".8"/><path d="M695 187v115h34v-72h50v-43M817 225v96h24v-96" fill="#221f1d" opacity=".18"/><path d="M535 271h95M640 221h61M709 179h99" stroke="#d7dcc5" opacity=".38" stroke-width="5"/><rect x="660" y="47" width="32" height="32" fill="#ecedda" opacity=".7"/></svg>`;
}
