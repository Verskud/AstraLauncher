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
function toast(text){$('#toast').textContent=typeof translateLegacyText==='function'?translateLegacyText(text):text;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3600)}
const coverTemplates = [
 ['forest','Тихий лес'],['desert','Тёплая долина'],['night','Сумерки'],
 ['snow','Снежные вершины'],['cherry','Цветущая роща'],['canyon','Красный каньон'],
 ['lagoon','Тихая лагуна'],['nether','Багровый мир'],['end','Звёздный край'],
];
function coverPicker(selected='forest', gradientId='cover-preview-art'){
 const choice=coverTemplates.some(([id])=>id===selected)?selected:'forest';
 return `<label>Обложка<select name="art">${coverTemplates.map(([id,label])=>`<option value="${id}" ${choice===id?'selected':''}>${label}</option>`).join('')}</select></label><div class="cover-preview">${art(choice,gradientId)}</div><div class="cover-options">${coverTemplates.map(([id,label])=>`<button type="button" data-cover-choice="${id}" class="cover-option ${choice===id?'selected':''}" aria-pressed="${choice===id}" aria-label="${label}" title="${label}">${art(id)}<span>${label}</span></button>`).join('')}</div>`;
}
