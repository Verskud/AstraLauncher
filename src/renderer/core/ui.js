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
function art(kind='forest',id='scene'){
 const colors=kind==='desert'?['#b49a84','#877c70','#514d43','#b4946b','#795f43']:kind==='night'?['#655778','#393d56','#282f43','#626176','#464354']:['#a4b9b3','#6e9292','#34595b','#829a73','#455f45'];
 let trees='';for(let i=0;i<16;i++){let x=300+i*39,y=140+(i%5)*18;trees+=`<g transform="translate(${x} ${y})"><path d="M0 0h12v58H0Z" fill="#344b42"/><path d="M-15 0h40v20h12v19h-62V20h10Z" fill="${i%2?'#435f51':'#526e58'}"/></g>`}
 return `<svg class="landscape" viewBox="0 0 900 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky-${id}" x2="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient></defs><rect width="900" height="350" fill="url(#sky-${id})"/><path d="M0 140h65v-25h55v30h60v-50h65v-30h55v30h70v38h60v-60h50v-30h45v35h55v65h70v-34h75v-50h50v50h55v30h80v217H0Z" fill="${colors[2]}" opacity=".38"/><path d="M0 225h90v-35h90v20h90v-45h80v25h80v-50h70v25h70v-20h85v30h70v-50h90v25h85v200H0Z" fill="${colors[2]}" opacity=".7"/>${kind==='forest'?trees:''}<path d="M0 240h130v30h130v30h180v-25h95v-35h100v-50h70v-28h115v35h80v153H0Z" fill="${colors[3]}"/><path d="M0 265h130v30h130v30h180v-25h95v-35h100v-50h70v-28h115v35h80v128H0Z" fill="${colors[4]}"/><path d="M345 350v-22h100v-20h95v-27h85v-26h40v95Z" fill="#8eb4b5" opacity=".8"/><path d="M695 187v115h34v-72h50v-43M817 225v96h24v-96" fill="#221f1d" opacity=".18"/><path d="M535 271h95M640 221h61M709 179h99" stroke="#d7dcc5" opacity=".38" stroke-width="5"/><rect x="660" y="47" width="32" height="32" fill="#ecedda" opacity=".7"/></svg>`;
}
