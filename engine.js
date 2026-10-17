(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PlazaEngine=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TAU=Math.PI*2,SPACING=.05;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),fract=x=>x-Math.floor(x),mix=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);
const PALETTES={gold:[[1,.34,.055],[1,.72,.28],[1,.93,.68]],party:[[.8,.025,.3],[.08,.28,1],[.02,1,.68],[1,.43,.03]],aurora:[[.035,.15,1],[.015,.9,.73],[.52,.055,1]]};
function radius(y){const u=clamp((y-4.05)/1.95);return .44+1.46*Math.pow(u,1.65);}
function makeGeometry(){const paths=[],points=[];let totalLength=0;
function add(tower,kind,index,path,closed=false){let length=0;const lengths=[0];for(let i=1;i<path.length;i++){length+=Math.hypot(...path[i].map((v,j)=>v-path[i-1][j]));lengths.push(length);}const count=Math.max(2,Math.round(length/SPACING)),first=points.length;let cursor=1;const nodes=[];
for(let i=0;i<count;i++){const d=closed?i/count*length:i/(count-1)*length;while(cursor<path.length-1&&lengths[cursor]<d)cursor++;const f=(d-lengths[cursor-1])/(lengths[cursor]-lengths[cursor-1]||1),p=path[cursor-1].map((v,j)=>v+(path[cursor][j]-v)*f);const a=fract(Math.atan2((p[0]-(tower===0?-3:3))*(tower===0?1:-1),p[2])/TAU);const node={x:p[0],y:p[1],z:p[2],h:p[1]/6,a,tower,kind,index,u:closed?i/count:i/(count-1),segment:paths.length,channel:points.length*3+1};points.push(node);nodes.push(node);}
paths.push({id:'T'+(tower+1)+'-'+kind+'-'+String(index+1).padStart(2,'0'),tower,kind,index,length,first,count,closed,nodes});totalLength+=length;}
for(let tower=0;tower<2;tower++){const cx=tower===0?-3:3,mirror=tower===0?1:-1;
for(let rib=0;rib<12;rib++){const a=rib/12*TAU,path=[];for(let k=0;k<=240;k++){const y=.16+(6-.16)*k/240,r=radius(y);path.push([cx+mirror*Math.sin(a)*r,y,Math.cos(a)*r]);}add(tower,'costilla',rib,path);}
const levels=[.16,.82,1.48,2.14,2.80,3.46,4.05,4.65,5.25,6];
levels.forEach((y,i)=>{const r=radius(y),path=[];for(let k=0;k<=320;k++){const a=k/320*TAU;path.push([cx+mirror*Math.sin(a)*r,y,Math.cos(a)*r]);}add(tower,y>4.1?'corona':'aro',i,path,true);});}
return {paths,points,spec:{height:6,stemHeight:4.05,crownDiameter:3.8,stemDiameter:.88,centerDistance:6,towers:2,ribsPerTower:12,ringsPerTower:10,pixelSpacing:SPACING,totalPixels:points.length,totalLength,channels:points.length*3,status:'Geometría conceptual interpretada de fotografía; diámetros y recorridos pendientes de medición.'}};
}
function currentCue(track,t){return track.cues.find(c=>t>=c.start&&t<c.end)||track.cues[track.cues.length-1];}
function color(p,t,track,brightness=.85){const cue=currentCue(track,t),pal=PALETTES[cue.palette]||PALETTES.gold,b=t*track.bpm/60,pulse=Math.exp(-fract(b)*4),phase=p.h*.55+p.a*.45,palMix=(v)=>{v=fract(v)*pal.length;return mix(pal[Math.floor(v)],pal[(Math.floor(v)+1)%pal.length],fract(v));};let c,g;
switch(cue.effect){case 'rise':c=palMix(p.h*.3+p.tower*.05);g=.08+.7*clamp((t/track.cues[0].end*1.3-p.h)*3);break;
case 'breathe':c=palMix(phase*.4+b/64);g=.45+.35*Math.sin(b*Math.PI/4+p.tower*.5);break;
case 'bloom':c=palMix(p.a*.6+b/32+p.tower*.12);g=.28+.65*(.5+.5*Math.cos(p.h*8-b*Math.PI/2));break;
case 'waves':c=palMix(p.h*.7-b/24+p.tower*.15);g=.42+.4*Math.sin(p.h*9-b*.8+p.tower);break;
case 'orbit':c=palMix(p.a-b/32);g=.2+.78*Math.pow(.5+.5*Math.cos(p.a*TAU*2-b*.6+p.h*3),2);break;
case 'dialogue':c=palMix(p.h*.6+p.tower*.45+b/64);g=.25+.7*(.5+.5*Math.sin(b*Math.PI/4+p.tower*Math.PI));break;
case 'cascade':c=palMix(p.h*.5+b/40+p.tower*.2);g=.18+.8*Math.pow(.5+.5*Math.sin(p.h*12+b*1.3+p.a*4),3);break;
case 'helix':c=palMix(p.a*2+p.h-b/24);g=.3+.65*Math.pow(.5+.5*Math.sin(p.a*TAU*2+p.h*12-b),2);break;
case 'finale':c=palMix(p.h*.6+p.a*.4-b/32);g=.7+.25*pulse;break;
default:c=pal[0];g=.8;}
if(t>=track.ignitionAt&&t<track.ignitionAt+.8){const f=Math.exp(-(t-track.ignitionAt)*4);c=mix(c,[1,.95,.8],f);g=Math.max(g,f);}
const tail=clamp((track.duration-t)/3.5);return c.map(x=>clamp(x*g*brightness*tail));}
function lights(points,t,track,brightness=.85){const result=new Float32Array(points.length*3);for(let i=0;i<points.length;i++)result.set(color(points[i],t,track,brightness),i*3);return result;}
return {makeGeometry,currentCue,color,lights,PALETTES};
});
