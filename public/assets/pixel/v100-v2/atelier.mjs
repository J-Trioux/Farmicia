import {WORLD,PLACES,ACTORS,stateFor,spriteFor,snapshot} from './world.mjs';
const $=id=>document.getElementById(id);
const labels={locked:'Fermé',available:'Disponible',construction:'En chantier',built:'Construit'};
let current=snapshot('complete'),selected=PLACES[0],onlyTerrain=false,zoom=1,route=[],moving=false;
const rosalie={...WORLD.spawn,direction:'south'};
const canvas=$('map'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const manifest=await fetch('./manifest.json').then(r=>{if(!r.ok)throw Error('Manifest unavailable');return r.json();});
const sprites={};
async function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error(src));im.src=src;});}
try{await Promise.all(Object.entries(manifest.sprites).map(async([id,s])=>{sprites[id]=await image(s.image);}));sprites.terrain=await image('terrain.png');}catch(error){$('map-status').textContent='Impossible de charger certains assets. Rechargez la page.';throw error;}
const hotspots=$('hotspots'),cards=$('places');
for(const place of PLACES){
  const spot=document.createElement('button');spot.className='hotspot';spot.style.left=`calc(${place.x}px * var(--zoom))`;spot.style.top=`calc(${place.y}px * var(--zoom))`;spot.dataset.place=place.id;spot.innerHTML='<span class="tag"></span>';spot.onclick=()=>select(place);hotspots.append(spot);
  const card=document.createElement('button');card.className='place-card';card.dataset.place=place.id;card.innerHTML=`<img alt="" width="128" height="112"><b>${place.name}</b><small></small>`;card.onclick=()=>select(place);cards.append(card);
}
for(const [id,name,role]of [['rosalie','Rosalie','Jardinière en voyage'],['anais','Anaïs','Batelière du port'],['mathis','Mathis','Meunier de la vallée'],['noe','Noé','Pépiniériste']]){
  const card=document.createElement('article');card.className='character-card';card.innerHTML=`<img src="${manifest.sprites[`${id}-south`].image}" width="96" height="96" alt="${name}"><div><h3>${name}</h3><p>${role}</p></div>`;$('cast').append(card);
}
function select(place){selected=place;refresh();}
function refresh(){
  const s=stateFor(selected,current.game,current.level),asset=spriteFor(selected,s);
  $('level').value=current.level;$('level-value').textContent=current.level;
  $('place-image').src=manifest.sprites[asset].image;$('place-image').alt=`${selected.name}, ${labels[s].toLowerCase()}`;
  $('place-name').textContent=selected.name;$('place-description').textContent=selected.description;$('reward').textContent=selected.reward;$('state').textContent=labels[s];
  $('requirement').textContent=s==='built'?'Lieu débloqué dans cet aperçu.':`${selected.valley?'Niveau 3 · 8 matériaux de livraison':`Niveau ${selected.level}${selected.requires?.length?' · pépinière terminée':''}`}. ${s==='locked'?'Conditions encore manquantes.':''}`;
  $('advance').disabled=s==='locked'||s==='built';$('advance').textContent=s==='built'?'Lieu débloqué':s==='construction'?'Achever dans l’aperçu':selected.upgrade?'Afficher l’achat réalisé':'Lancer le chantier';
  $('visit').disabled=onlyTerrain;
  $('count').textContent=`${PLACES.filter(p=>stateFor(p,current.game,current.level)==='built').length} / ${PLACES.length}`;
  for(const p of PLACES){const st=stateFor(p,current.game,current.level),sp=spriteFor(p,st);const spot=hotspots.querySelector(`[data-place="${p.id}"]`),card=cards.querySelector(`[data-place="${p.id}"]`);spot.className=`hotspot ${st}${p===selected?' selected':''}`;spot.setAttribute('aria-label',`${p.name}, ${labels[st]}, sélectionner`);spot.querySelector('.tag').textContent=`${st==='locked'?'○ ':st==='construction'?'◷ ':''}${p.name}`;card.querySelector('img').src=manifest.sprites[sp].image;card.querySelector('small').textContent=labels[st];card.setAttribute('aria-pressed',String(p===selected));}
  hotspots.hidden=onlyTerrain;draw();
}
function render(id,x,y,flip=false){const im=sprites[id],m=manifest.sprites[id];if(!im||!m)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));if(flip)ctx.scale(-1,1);ctx.drawImage(im,-m.anchor[0],-m.anchor[1]);ctx.restore();}
function draw(){
  ctx.clearRect(0,0,WORLD.width,WORLD.height);ctx.drawImage(sprites.terrain,0,0);
  if(onlyTerrain)return;
  const relayBuilt=stateFor(PLACES.find(p=>p.id==='relais'),current.game,current.level)==='built';
  if(relayBuilt){render('ponton',560,411);render('barque',667,447);}
  const layers=PLACES.map(p=>({id:spriteFor(p,stateFor(p,current.game,current.level)),x:p.x,y:p.y}));
  for(const actor of ACTORS){if(actor.id==='rosalie')layers.push({id:`rosalie-${moving&&rosalie.direction==='south'?'step':rosalie.direction==='west'?'east':rosalie.direction}`,x:rosalie.x,y:rosalie.y,flip:rosalie.direction==='west'});else if(actor.id!=='anais'||relayBuilt)layers.push({id:`${actor.id}-south`,x:actor.x,y:actor.y});}
  layers.sort((a,b)=>a.y-b.y);for(const l of layers)render(l.id,l.x,l.y,l.flip);
}
function resetRoute(){route=[];moving=false;Object.assign(rosalie,WORLD.spawn,{direction:'south'});}
for(const button of document.querySelectorAll('[data-preset]'))button.onclick=()=>{current=snapshot(button.dataset.preset);resetRoute();for(const b of document.querySelectorAll('[data-preset]'))b.setAttribute('aria-pressed',String(button===b));$('map-status').textContent='Progression simulée mise à jour.';refresh();};
$('level').oninput=event=>{current.level=Number(event.target.value);for(const b of document.querySelectorAll('[data-preset]'))b.setAttribute('aria-pressed','false');refresh();};
$('advance').onclick=()=>{
  const state=stateFor(selected,current.game,current.level);if(state==='locked'||state==='built')return;
  if(selected.upgrade)current.game.upgrades.push(selected.upgrade);
  else if(selected.valley){current.game.valley.projectPoints=state==='construction'?8:4;current.game.valley.projectDone=state==='construction';}
  else if(state==='construction'){current.game.projects.done.push(selected.project);current.game.projects.active=null;}
  else current.game.projects.active=selected.project;
  for(const b of document.querySelectorAll('[data-preset]'))b.setAttribute('aria-pressed','false');$('map-status').textContent=`${selected.name} : ${labels[stateFor(selected,current.game,current.level)].toLowerCase()}.`;refresh();
};
for(const b of document.querySelectorAll('[data-zoom]'))b.onclick=()=>{zoom=Number(b.dataset.zoom);$('world').style.setProperty('--zoom',zoom);$('world').style.width=`${WORLD.width*zoom}px`;$('world').style.height=`${WORLD.height*zoom}px`;for(const other of document.querySelectorAll('[data-zoom]'))other.setAttribute('aria-pressed',String(b===other));};
$('terrain').onclick=()=>{onlyTerrain=!onlyTerrain;$('terrain').setAttribute('aria-pressed',String(onlyTerrain));$('map-status').textContent=onlyTerrain?'Terrain vierge : aucun lieu ni personnage dans l’image de fond.':'Les sprites sont superposés au terrain.';refresh();};
// Paths follow the walkways in the terrain art; buildings are not baked into navigation.
function navigate(x,y){
  const targetY=Math.abs(y-195)<Math.abs(y-337)?195:337;
  const targetX=Math.max(68,Math.min(710,x));
  const crossX=Math.abs(rosalie.x-285)+Math.abs(targetX-285)<Math.abs(rosalie.x-494)+Math.abs(targetX-494)?285:494;
  route=Math.abs(rosalie.y-targetY)<2?[{x:targetX,y:targetY}]:[{x:crossX,y:rosalie.y},{x:crossX,y:targetY},{x:targetX,y:targetY}];moving=true;
}
$('visit').onclick=()=>{navigate(...selected.door);$('map-status').textContent=`Rosalie rejoint ${selected.name.toLowerCase()}.`;};
canvas.onclick=event=>{if(onlyTerrain)return;const r=canvas.getBoundingClientRect();navigate((event.clientX-r.left)/zoom,(event.clientY-r.top)/zoom);};
canvas.onkeydown=event=>{const p={ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-142],ArrowDown:[0,142]}[event.key];if(p&&!onlyTerrain){event.preventDefault();navigate(rosalie.x+p[0],rosalie.y+p[1]);}};
let last=performance.now();function tick(time){const dt=Math.min(.04,(time-last)/1000);last=time;if(route.length&&!onlyTerrain){const next=route[0],dx=next.x-rosalie.x,dy=next.y-rosalie.y,len=Math.hypot(dx,dy),speed=80;rosalie.direction=Math.abs(dx)>Math.abs(dy)?dx<0?'west':'east':dy<0?'north':'south';if(len<speed*dt){rosalie.x=next.x;rosalie.y=next.y;route.shift();}else{rosalie.x+=dx/len*speed*dt;rosalie.y+=dy/len*speed*dt;}moving=route.length>0;draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
$('map-status').textContent='6 lieux indépendants · cliquez pour explorer.';refresh();
