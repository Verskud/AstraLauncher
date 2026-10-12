const fs=require('node:fs/promises');
const {createReadStream}=require('node:fs');
const {safePath}=require('./zip-reader.cjs');
const table=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});

async function writeZip(filename,entries){
 const file=await fs.open(filename,'wx'),central=[];let position=0;
 const now=new Date(),dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),dosDate=((Math.min(2107,Math.max(1980,now.getFullYear()))-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
 const write=async bytes=>{let cursor=0;while(cursor<bytes.length){const result=await file.write(bytes,cursor,bytes.length-cursor,position);if(!result.bytesWritten)throw new Error('Не удалось записать архив.');cursor+=result.bytesWritten;position+=result.bytesWritten;}if(position>=0xffffffff)throw new Error('ZIP превышает 4 ГБ.');};
 try{
 if(entries.length>10000)throw new Error('Слишком много файлов для ZIP.');
 for(const entry of entries){
 const name=Buffer.from(safePath(entry.name),'utf8'),offset=position,header=Buffer.alloc(30);
 header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x808,6);header.writeUInt16LE(dosTime,10);header.writeUInt16LE(dosDate,12);header.writeUInt16LE(name.length,26);
 await write(header);await write(name);let crc=0xffffffff,size=0;
 const chunks=entry.bytes ? [entry.bytes] : createReadStream(entry.path);
 for await(const chunk of chunks){size+=chunk.length;if(size>1024*1024*1024)throw new Error('Файл в архиве превышает 1 ГБ.');for(const byte of chunk)crc=table[(crc^byte)&255]^(crc>>>8);await write(chunk);}
 crc=(crc^0xffffffff)>>>0;const descriptor=Buffer.alloc(16);descriptor.writeUInt32LE(0x08074b50);descriptor.writeUInt32LE(crc,4);descriptor.writeUInt32LE(size,8);descriptor.writeUInt32LE(size,12);await write(descriptor);
 const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x808,8);record.writeUInt16LE(dosTime,12);record.writeUInt16LE(dosDate,14);record.writeUInt32LE(crc,16);record.writeUInt32LE(size,20);record.writeUInt32LE(size,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE(offset,42);central.push(record,name);
 }
 const start=position;for(const bytes of central)await write(bytes);const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(position-start,12);end.writeUInt32LE(start,16);await write(end);await file.close();
 }catch(error){await file.close().catch(()=>{});await fs.rm(filename,{force:true}).catch(()=>{});throw error;}
}
module.exports={writeZip};
