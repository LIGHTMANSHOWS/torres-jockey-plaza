'use strict';
// FSEQ v2, zlib blocks, 40 fps. Uses the same geometry and color engine as the viewer.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),root=path.resolve(__dirname,'..'),E=require(path.join(root,'engine.js'));
const G=E.makeGeometry(),library=JSON.parse(fs.readFileSync(path.join(root,'tracks.json'),'utf8')).tracks;
const requested=process.argv[2]||'all',brightness=Number(process.argv[3]||'.5');
if(!(brightness>0&&brightness<=1))throw Error('Brillo válido: 0 < brillo <= 1');
const tracks=requested==='all'?library:library.filter(t=>t.id===requested);if(!tracks.length)throw Error('Pista: encuentro, pulso, aurora o all');
fs.writeFileSync(path.join(root,'geometry.json'),JSON.stringify({spec:G.spec,segments:G.paths.map(({nodes,...p})=>p),points:G.points}));
const csv=['segmento,torre,tipo,metros,pixeles,primer_pixel,ultimo_pixel,canal_rgb_inicio,canal_rgb_fin'];
for(const p of G.paths)csv.push([p.id,p.tower+1,p.kind,p.length.toFixed(3),p.count,p.first+1,p.first+p.count,p.first*3+1,(p.first+p.count)*3].join(','));
fs.writeFileSync(path.join(root,'segments.csv'),csv.join('\n'));
function field(code,value){const t=Buffer.from(value+'\0'),b=Buffer.alloc(t.length+4);b.writeUInt16LE(b.length);b.write(code,2,2,'ascii');t.copy(b,4);return b;}
for(const track of tracks){const channels=G.points.length*3,frames=Math.ceil(track.duration*40),blockFrames=120,blocks=Math.ceil(frames/blockFrames),media=field('mf',path.basename(track.audio)),producer=field('sp','LIGHTMAN Jockey Plaza 2026'),fixed=32+blocks*8,offset=Math.ceil((fixed+media.length+producer.length)/4)*4,header=Buffer.alloc(offset),out=path.join(root,'assets/sequences',track.id+'.fseq');
header.write('PSEQ');header.writeUInt16LE(offset,4);header[7]=2;header.writeUInt16LE(fixed,8);header.writeUInt32LE(channels,10);header.writeUInt32LE(frames,14);header[18]=25;header[20]=2;header[21]=blocks;header.writeBigUInt64LE(BigInt(Date.now()),24);media.copy(header,fixed);producer.copy(header,fixed+media.length);fs.mkdirSync(path.dirname(out),{recursive:true});const fd=fs.openSync(out,'w');fs.writeSync(fd,header);let bytes=offset;
try{for(let b=0;b<blocks;b++){const start=b*blockFrames,count=Math.min(blockFrames,frames-start),raw=Buffer.alloc(count*channels);for(let j=0;j<count;j++){const colors=E.lights(G.points,(start+j)/40,track,brightness);if(start+j===frames-1)colors.fill(0);for(let c=0;c<channels;c++)raw[j*channels+c]=Math.round(colors[c]*255);}const compressed=zlib.deflateSync(raw,{level:6});header.writeUInt32LE(start,32+b*8);header.writeUInt32LE(compressed.length,36+b*8);fs.writeSync(fd,compressed);bytes+=compressed.length;}fs.writeSync(fd,header,0,header.length,0);}finally{fs.closeSync(fd);}console.log(JSON.stringify({track:track.id,frames,channels,fps:40,duration:frames/40,brightness,bytes}));}
