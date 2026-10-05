/** Asset scene data. Reads the existing Game fields; never mutates a save. */
export const WORLD = { width: 768, height: 512, tile: 8, spawn: { x: 378, y: 195 } };
export const PLACES = [
  {id:'halle',name:'Halle des terroirs',project:'halle-terroirs',requires:['pepiniere-voisins'],level:7,sprite:'halle',x:151,y:181,door:[151,195],footprint:[91,132,119,47],description:'Les spécialités de Rosalie trouvent leur place au marché.',reward:'Un second contrat de spécialité.'},
  {id:'pepiniere',name:'Pépinière des voisins',project:'pepiniere-voisins',level:3,sprite:'pepiniere',x:383,y:181,door:[383,195],footprint:[319,133,126,47],description:'Semis, variétés de la ferme et graines à partager.',reward:'Une graine de lignée supplémentaire toutes les deux récoltes.'},
  {id:'atelier',name:'Atelier de cuisine',upgrade:'workshop',level:4,sprite:'atelier',x:606,y:181,door:[606,195],footprint:[548,134,116,46],description:'Un four, une table de travail et les recettes du village.',reward:'Accès à la cuisine ; le banquet de Lucie améliore le four.'},
  {id:'verger',name:'Verger de Jeanne',project:'verger',level:5,sprite:'verger',x:151,y:325,door:[151,337],footprint:[86,262,127,59],description:'Un vieux verger retrouve ses couleurs et ses fruits.',reward:'Trois fruits de belle qualité ou mieux toutes les 30 minutes.'},
  {id:'poulailler',name:'Poulailler',upgrade:'coop',level:6,sprite:'poulailler',x:383,y:325,door:[383,337],footprint:[334,276,99,48],description:'Un abri et une petite rampe pour les poules de Rosalie.',reward:'Production d’œufs selon les règles du jeu.'},
  {id:'relais',name:'Relais de la vallée',valley:true,level:3,sprite:'relais',x:606,y:325,door:[606,337],footprint:[551,276,115,48],description:'Les livraisons financent un relais au bord de la rivière.',reward:'Troisième emplacement de caravane après 8 matériaux.'},
];
export const ACTORS = [
  {id:'rosalie',name:'Rosalie',x:378,y:195},
  {id:'anais',name:'Anaïs',x:560,y:365},
  {id:'mathis',name:'Mathis',x:590,y:195},
  {id:'noe',name:'Noé',x:408,y:195},
];
export function stateFor(place, game, level) {
  const done=game.projects?.done??[];
  if(place.valley){
    if(level<place.level && !game.valley?.projectDone)return 'locked';
    if(game.valley?.projectDone)return 'built';
    return (game.valley?.projectPoints??0)>0?'construction':'available';
  }
  if(place.upgrade && (game.upgrades??[]).includes(place.upgrade))return 'built';
  if(place.project && done.includes(place.project))return 'built';
  if(level<place.level || (place.requires??[]).some(id=>!done.includes(id)))return 'locked';
  if(place.project && game.projects?.active===place.project)return 'construction';
  return 'available';
}
export function spriteFor(place,state){
  if(state==='built')return place.sprite;
  if(place.id==='verger')return state==='locked'?'verger-abandonne':'verger-jeune';
  if(place.id==='relais' && state!=='construction')return 'acces-ferme';
  return state==='locked'?'terrain-ferme':state==='available'?'fondations':'chantier';
}
export function snapshot(name){
  if(name==='complete')return {level:12,game:{projects:{done:['marche','moissons','banquet','verger','pepiniere-voisins','halle-terroirs'],active:null},upgrades:['workshop','coop'],valley:{projectDone:true,projectPoints:8}}};
  if(name==='progress')return {level:6,game:{projects:{done:['marche','pepiniere-voisins'],active:'verger'},upgrades:['coop'],valley:{projectDone:false,projectPoints:4}}};
  return {level:1,game:{projects:{done:[],active:null},upgrades:[],valley:{projectDone:false,projectPoints:0}}};
}
