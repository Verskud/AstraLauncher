const defaults={packs:[],profile:'Player',memory:4,backups:true,theme:'dark'};
let state;try{state=JSON.parse(localStorage.getItem('astra-v1'))||structuredClone(defaults);if(!Array.isArray(state.packs))throw Error();}catch{state=structuredClone(defaults)}
const modCount = n => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'мод' : [2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100) ? 'мода' : 'модов'}`;
let page='discover',query='',category='Все',loader='Все',selectedPack=null;
const save=()=>{try{localStorage.setItem('astra-v1',JSON.stringify(state))}catch{toast('Не удалось сохранить данные: хранилище браузера недоступно.')}};
