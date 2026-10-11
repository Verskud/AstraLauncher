// Shared vector covers: every scene has its own terrain and consistent block geometry.
let coverSequence = 0;
function art(kind = 'forest') {
  const colors = {
    forest: ['#88b4b3','#d6d9af','#557b76','#334e49','#688456'],
    desert: ['#c7957c','#f4d19b','#c79562','#836142','#d6ad70'],
    night: ['#25243e','#75698a','#494660','#252f42','#48566a'],
    snow: ['#729aae','#d5e4e5','#8aa4b6','#566f86','#e6eeee'],
    cherry: ['#b9a4bf','#f8d8c9','#8d929b','#655d7b','#9aaf87'],
    canyon: ['#c58568','#f3c891','#bd7852','#714336','#b57c56'],
    lagoon: ['#679eac','#c5dacf','#55848a','#2e5d63','#6d9690'],
    nether: ['#241824','#6b3038','#68313c','#321c2c','#8c3b3d'],
    end: ['#161b32','#564767','#494362','#28263d','#b3aa83'],
  };
  if (!colors[kind]) kind = 'forest';
  const [skyTop, skyBottom, far, dark, ground] = colors[kind];
  const gid = `cover-sky-${++coverSequence}`;
  const rect = (x,y,w,h,color,opacity=1) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="${opacity}"/>`;
  const path = (d,color,opacity=1) => `<path d="${d}" fill="${color}" opacity="${opacity}"/>`;
  const pine = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${rect(-5,-67,10,67,'#3c4540')}${path('M-9-130H9V-113H23V-96H35V-76H48V-54H-48V-76H-35V-96H-23V-113H-9Z',kind==='night'?'#3e4c59':'#385d50')}${path('M-9-130H9V-113H23V-96H0V-76H-35V-96H-23V-113H-9Z',kind==='night'?'#596778':'#63826c')}</g>`;
  const blossom = (x,y,s=1) => `<g transform="translate(${x} ${y}) scale(${s})">${rect(-6,-90,12,90,'#685165')}${path('M-50-131H-21V-148H23V-131H54V-110H66V-77H40V-65H-39V-78H-66V-111H-50Z','#dc96b6')}${path('M-50-131H-21V-148H23V-131H40V-112H-7V-95H-66V-111H-50Z','#f0b9cf')}</g>`;
  const stars = () => [[66,44],[148,99],[245,38],[336,76],[471,35],[545,91],[651,48],[812,106],[865,29]].map(([x,y])=>rect(x,y,3,3,'#e9e1f5',.75)).join('');
  let scene = '';
  const ridge = path('M0 206H80V176H160V152H232V184H310V161H398V126H489V165H579V192H660V147H752V176H830V199H900V350H0Z',far,.7);
  const terrain = path('M0 263H155V279H300V264H457V251H622V267H755V254H900V350H0Z',ground) + path('M0 292H155V310H300V294H457V282H622V296H755V282H900V350H0Z',dark,.6);
  if (kind === 'forest' || kind === 'night') {
    scene = (kind === 'night' ? stars()+rect(607,45,40,40,'#ede4c8')+rect(624,39,30,33,skyTop) : rect(632,48,40,40,'#f1e7bd')) + ridge;
    scene += pine(92,263,.55)+pine(254,264,.6)+pine(595,267,.7)+terrain+pine(95,292,.9)+pine(421,282,1.08)+pine(793,282,.82);
    scene += path('M555 350V323H524V304H492V282H524V305H560V322H613V350Z',kind==='night'?'#879cae':'#bed0bb');
  } else if (kind === 'desert') {
    scene = rect(626,49,43,43,'#ffe6b2')+ridge+terrain;
    scene += path('M0 320H100V303H263V317H423V301H605V317H779V302H900V350H0Z','#dfbb83');
    scene += path('M146 292V200H162V292ZM130 223H146V238H118V201H130ZM162 219H179V193H191V233H162Z','#587663');
    scene += path('M689 290V224H702V290ZM675 241H689V254H664V225H675ZM702 239H717V211H728V250H702Z','#708369');
  } else if (kind === 'snow') {
    scene = path('M0 252H59V205H114V158H161V117H210V66H251V117H298V159H346V201H400V152H449V111H496V53H538V111H587V158H637V206H691V171H741V120H780V171H832V221H900V350H0Z',dark);
    scene += path('M114 158H161V117H210V66H251V117H298V159H267V145H234V125H207V148H175V175H142V191H114ZM400 152H449V111H496V53H538V111H587V158H551V146H520V131H484V156H449V177H400Z','#edf3ef');
    scene += terrain+path('M0 265H155V281H300V266H457V253H622V269H755V256H900V274H755V287H622V273H457V283H300V299H155V283H0Z','#ffffff',.6);
  } else if (kind === 'cherry') {
    scene = rect(646,43,34,34,'#ffe8ce')+ridge+blossom(198,264,.63)+blossom(596,267,.72)+terrain+blossom(80,292,.91)+blossom(391,282,1.04)+blossom(805,282,.9);
    scene += [[259,287],[491,307],[623,285],[186,326],[767,319]].map(([x,y])=>rect(x,y,7,4,'#efbed1')).join('');
  } else if (kind === 'canyon') {
    scene = rect(647,49,40,40,'#f4d7a5')+ridge;
    scene += path('M0 350V166H42V103H151V153H206V218H282V350ZM600 350V211H663V141H730V89H837V146H900V350Z','#99543e');
    scene += path('M0 190H206V201H0ZM0 231H282V245H0ZM663 173H900V185H663ZM600 245H900V258H600Z','#d39462');
    scene += path('M282 350V312H347V280H406V255H462V274H520V310H600V350Z','#d8ac78')+path('M372 350V319H417V282H451V316H494V350Z','#805749');
  } else if (kind === 'lagoon') {
    scene = rect(642,43,37,37,'#eee6c0')+ridge+rect(0,251,900,99,'#397d89');
    scene += path('M0 252H176V269H248V284H327V310H0ZM632 302V278H705V262H778V246H900V350H632Z','#385d57');
    scene += path('M0 251H176V268H248V283H327V293H231V278H157V264H0ZM632 302V278H705V262H778V246H900V260H791V275H719V291H646V313H632Z','#bed0a3');
    scene += pine(85,251,.65)+pine(835,246,.73)+rect(378,275,130,3,'#9bc6c7',.65)+rect(451,308,124,3,'#9bc6c7',.5)+rect(319,339,226,3,'#9bc6c7',.4);
  } else if (kind === 'nether') {
    scene = ridge+rect(0,275,900,75,'#d75d40')+rect(0,315,900,8,'#f19a57',.65);
    scene += path('M0 350V231H46V151H104V211H170V269H245V350ZM652 350V267H706V177H753V105H812V192H858V235H900V350Z','#33232e');
    scene += path('M46 151H104V165H46ZM706 177H753V193H706ZM753 105H812V119H753ZM0 271H170V286H0ZM706 271H900V285H706Z','#8b484c');
    scene += [[298,120],[454,81],[620,149],[376,225]].map(([x,y])=>rect(x,y,5,7,'#ffb166',.7)).join('');
  } else {
    scene = stars();
    scene += path('M59 216H234V237H284V257H230V279H191V301H150V277H110V254H59Z','#71698a')+path('M59 216H234V237H284V252H222V242H134V230H59Z',ground);
    scene += path('M380 249H691V270H750V294H695V318H632V340H550V321H483V296H421V276H380Z','#68627c')+path('M380 249H691V270H750V285H682V276H525V264H380Z',ground);
    scene += path('M758 159H857V177H888V191H854V211H820V229H794V205H765V182H738V171H758Z','#726783')+rect(758,159,99,13,ground);
    scene += rect(157,116,23,103,'#30283f')+rect(548,106,28,148,'#30283f')+rect(624,158,20,105,'#30283f')+rect(546,103,32,6,'#9583b0');
  }
  return `<svg class="landscape" data-cover="${kind}" viewBox="0 0 900 350" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient></defs><rect width="900" height="350" fill="url(#${gid})"/>${scene}</svg>`;
}
