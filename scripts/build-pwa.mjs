import {mkdirSync,writeFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
export function crc32(bytes){let n=0xffffffff;for(const byte of bytes){n^=byte;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type);const out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length);t.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,data])),8+data.length);return out;}
export function iconPng(size){
 if(![192,512].includes(size))throw Error('Unsupported icon size');
 const pixels=Buffer.alloc((size*4+1)*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const X=x/size,Y=y/size,i=y*(size*4+1)+1+x*4;
  const white=X>=.33&&X<=.67&&Y>=.24&&Y<=.76&&(X<.385||X>.615||Y<.295||Y>.705||Y>.4725&&Y<.5275);
  pixels[i]=white?255:46;pixels[i+1]=white?255:139;pixels[i+2]=white?255:87;pixels[i+3]=255;
 }
 const header=Buffer.alloc(13);header.writeUInt32BE(size);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
}
export function buildPwa(directory='dist'){
 mkdirSync(directory+'/icons',{recursive:true});
 for(const size of [192,512])writeFileSync(directory+'/icons/app-'+size+'.png',iconPng(size));
 const sha=process.env.GITHUB_SHA??'local';
 writeFileSync(directory+'/release.json',JSON.stringify({sha,builtAt:new Date().toISOString()}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)buildPwa();
