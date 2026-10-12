
function paintSkin3D(canvas, skin, cape, model, yaw) {
 const ctx=canvas.getContext('2d');
 const width=canvas.width,height=canvas.height,scale=Math.min(width/25,height/39);
 ctx.clearRect(0,0,width,height);
 ctx.imageSmoothingEnabled=false;
 const pitch=.22,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
 const project=([x,y,z])=>{
  const horizontal=x*cy+z*sy,depth=z*cy-x*sy;
  return {x:width/2+horizontal*scale,y:height*.49+(y*cp-depth*sp)*scale,depth};
 };
 const faces=[];
 const addBox=(bounds,uv,texture,inflate=0,color=null)=>{
  let [x0,y0,z0,x1,y1,z1]=bounds;
  x0-=inflate;y0-=inflate;z0-=inflate;x1+=inflate;y1+=inflate;z1+=inflate;
  const corners={
   front:[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],
   back:[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],
   left:[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],
   right:[[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],
   top:[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],
   bottom:[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]]
  };
  for(const side of Object.keys(corners)){
   const points=corners[side].map(project);
   faces.push({points,uv:uv?.[side],texture,color,side,shade:inflate===0,depth:points.reduce((sum,p)=>sum+p.depth,0)/4});
  }
 };
 const cubeUV=(x,y,w,d,h)=>({
  top:[x+d,y,w,d],bottom:[x+d+w,y,w,d],
  left:[x,y+d,d,h],front:[x+d,y+d,w,h],right:[x+d+w,y+d,d,h],back:[x+d+w+d,y+d,w,h]
 });
 const arm=model==='slim'?3:4;
 const parts=[
  {box:[-4,-16,-4,4,-8,4],uv:cubeUV(0,0,8,8,8),outer:cubeUV(32,0,8,8,8),color:'#a98d79'},
  {box:[-4,-8,-2,4,4,2],uv:cubeUV(16,16,8,4,12),outer:cubeUV(16,32,8,4,12),color:'#6c8293'},
  {box:[-4-arm,-8,-2,-4,4,2],uv:cubeUV(40,16,arm,4,12),outer:cubeUV(40,32,arm,4,12),color:'#718899'},
  {box:[4,-8,-2,4+arm,4,2],uv:cubeUV(32,48,arm,4,12),outer:cubeUV(48,48,arm,4,12),color:'#718899'},
  {box:[-4,4,-2,0,16,2],uv:cubeUV(0,16,4,4,12),outer:cubeUV(0,32,4,4,12),color:'#495768'},
  {box:[0,4,-2,4,16,2],uv:cubeUV(16,48,4,4,12),outer:cubeUV(0,48,4,4,12),color:'#495768'}
 ];
 for(const part of parts){
  addBox(part.box,part.uv,skin,0,part.color);
  if(skin?.height===64)addBox(part.box,part.outer,skin,.27);
 }
 if(cape){
  const corners=[[-5,-7,-2.9],[5,-7,-2.9],[5,9,-2.9],[-5,9,-2.9]].map(project);
  faces.push({points:corners,uv:[12,1,10,16],texture:cape,depth:corners.reduce((sum,p)=>sum+p.depth,0)/4});
 }
 faces.sort((a,b)=>a.depth-b.depth);
 for(const face of faces){
  const [a,b,,d]=face.points;
  if(face.texture&&face.uv){
   const [sx,sy0,sw,sh]=face.uv;
   ctx.save();
   ctx.setTransform((b.x-a.x)/sw,(b.y-a.y)/sw,(d.x-a.x)/sh,(d.y-a.y)/sh,a.x,a.y);
   ctx.drawImage(face.texture,sx,sy0,sw,sh,0,0,sw,sh);
   ctx.restore();
  }else if(face.color){
   ctx.fillStyle=face.color;ctx.beginPath();
   face.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
  }
  if(face.shade&&face.side!=='front'){
   ctx.fillStyle=face.side==='top'?'rgba(255,255,255,.07)':face.side==='bottom'?'rgba(0,0,0,.24)':'rgba(0,0,0,.12)';
   ctx.beginPath();face.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();
  }
 }
}
