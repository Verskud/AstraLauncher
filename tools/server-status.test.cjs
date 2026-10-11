const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net');
const {parseAddress,ping,varint,readVarint,frame,motd}=require('../src/main/server-status.cjs');
test('addresses validate ports, IPv6 and reject URLs or control characters',()=>{
 assert.equal(parseAddress('play.example.com').port,25565);
 assert.equal(parseAddress('[::1]:25570').host,'::1');
 for(const value of ['https://example.com','host:0','host:65536','host\n:12','../host','[a:b]:123'])assert.throws(()=>parseAddress(value));
 assert.equal(motd({text:'§aHello ',extra:[{text:'world'}]}),'§aHello world');
});
test('fragmented status and ping pong are decoded and connection closes',async()=>{
 let closed=false;
 const server=net.createServer(socket=>{
 let input=Buffer.alloc(0),phase=0;
 socket.on('error',()=>{});socket.on('close',()=>{closed=true;});
 socket.on('data',chunk=>{input=Buffer.concat([input,chunk]);while(input.length){const size=readVarint(input);if(!size||input.length<size.end+size.value)return;const packet=input.subarray(size.end,size.end+size.value);input=input.subarray(size.end+size.value);phase++;
 if(phase===2){const json=Buffer.from(JSON.stringify({description:{text:'§aTest',extra:[{text:' server'}]},players:{online:3,max:20},version:{name:'1.21.1'}}));const reply=frame(Buffer.concat([varint(0),varint(json.length),json]));socket.write(reply.subarray(0,3));setTimeout(()=>socket.write(reply.subarray(3)),10);}
 if(phase===3)socket.write(frame(packet));}});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const result=await ping(`127.0.0.1:${server.address().port}`);assert.equal(result.online,true);assert.equal(result.motd,'Test server');assert.equal(result.players,3);assert.equal(typeof result.ping,'number');await new Promise(resolve=>setTimeout(resolve,20));assert.equal(closed,true);}finally{await new Promise(resolve=>server.close(resolve));}
});
test('unresponsive sockets time out without hanging',async()=>{
 const sockets=[];const server=net.createServer(socket=>sockets.push(socket));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const result=await ping(`127.0.0.1:${server.address().port}`,{timeoutMs:50});assert.equal(result.online,false);assert.equal(result.reason,'timeout');}finally{sockets.forEach(socket=>socket.destroy());await new Promise(resolve=>server.close(resolve));}
});
