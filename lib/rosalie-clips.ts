/**
 * 0.9.7 — Animations de Rosalie (sprites de l’auteur, préparés avec ChatGPT).
 * Fichier généré par scripts/rosalie-clips.mjs depuis
 * assets/livraison-rosalie-v100/manifest.json : ne pas modifier à la main.
 */
/** Atlas haute définition (scripts/prepare-rosalie-hd.py, puis integrer-assets-1.0.py) : 8 × 12 images de 160 × 192. */
export const ROSALIE_ATLAS = '/assets/pixel/rosalie-v100/rosalie-atlas-hd.png';
export const ROSALIE_FRAME = { w: 80, h: 96, pivot: [40, 88], columns: 8, rows: 12 } as const;
export type RosalieCue = { at: number; type: string; offset: [number, number] };
export type RosalieClip = {
  /** colonne et rangée de chaque image dans l’atlas */
  frames: [number, number][];
  durations: number[];
  loop: boolean;
  reducedFrame: number;
  cues: RosalieCue[];
};
export const ROSALIE_CLIPS: Record<string, RosalieClip> = {
  'idle': {"frames":[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]],"durations":[400,200,200,75,80,75,200,370],"loop":true,"reducedFrame":0,"cues":[]},
  'walk-down': {"frames":[[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1]],"durations":[80,80,80,80,80,80,80,80],"loop":true,"reducedFrame":0,"cues":[]},
  'walk-up': {"frames":[[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2]],"durations":[80,80,80,80,80,80,80,80],"loop":true,"reducedFrame":0,"cues":[]},
  'walk-right': {"frames":[[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3]],"durations":[80,80,80,80,80,80,80,80],"loop":true,"reducedFrame":0,"cues":[]},
  'walk-left': {"frames":[[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4]],"durations":[80,80,80,80,80,80,80,80],"loop":true,"reducedFrame":0,"cues":[]},
  'harvest': {"frames":[[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5]],"durations":[40,40,40,60,90,75,60,35],"loop":false,"reducedFrame":5,"cues":[{"at":180,"type":"harvest-pop","offset":[25,-15]}]},
  'water': {"frames":[[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6]],"durations":[70,70,40,140,140,90,80,70],"loop":false,"reducedFrame":4,"cues":[{"at":180,"type":"water-start","offset":[22,-24]},{"at":550,"type":"water-stop","offset":[22,-24]}]},
  'plant': {"frames":[[0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7]],"durations":[50,50,40,40,100,90,80,50],"loop":false,"reducedFrame":4,"cues":[{"at":180,"type":"seeds","offset":[21,-22]},{"at":340,"type":"soil","offset":[33,-2]}]},
  'look-left': {"frames":[[2,4]],"durations":[1000],"loop":true,"reducedFrame":0,"cues":[]},
  'look-right': {"frames":[[2,3]],"durations":[1000],"loop":true,"reducedFrame":0,"cues":[]},
  'back': {"frames":[[2,2]],"durations":[1000],"loop":true,"reducedFrame":0,"cues":[]},
  'hoe': {"frames":[[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8]],"durations":[100,100,100,100,100,100,100,100],"loop":true,"reducedFrame":3,"cues":[]},
  'cook': {"frames":[[0,9],[1,9],[2,9],[3,9],[4,9],[5,9],[6,9],[7,9]],"durations":[100,100,100,100,100,100,100,100],"loop":false,"reducedFrame":4,"cues":[]},
  'eggs': {"frames":[[0,10],[1,10],[2,10],[3,10],[4,10],[5,10],[6,10],[7,10]],"durations":[100,100,100,100,100,100,100,100],"loop":false,"reducedFrame":3,"cues":[]},
  'celebrate': {"frames":[[0,11],[1,11],[2,11],[3,11],[4,11],[5,11],[6,11],[7,11]],"durations":[100,100,100,100,100,100,100,100],"loop":false,"reducedFrame":3,"cues":[]},
};
export type RosalieEffect = { image: string; frameSize: [number, number]; frames: number; durations: number[]; anchor: [number, number] };
export const ROSALIE_EFFECTS: Record<string, RosalieEffect> = {
  water: {"image":"/assets/pixel/rosalie-v100/fx-hd/water.png","frameSize":[64,64],"frames":6,"durations":[65,65,65,65,65,65],"anchor":[16,16]},
  seeds: {"image":"/assets/pixel/rosalie-v100/fx-hd/seeds.png","frameSize":[64,64],"frames":6,"durations":[60,60,60,60,60,60],"anchor":[16,16]},
  soil: {"image":"/assets/pixel/rosalie-v100/fx-hd/soil.png","frameSize":[64,64],"frames":6,"durations":[60,60,60,60,60,60],"anchor":[16,16]},
  harvest: {"image":"/assets/pixel/rosalie-v100/fx-hd/harvest.png","frameSize":[64,64],"frames":6,"durations":[60,60,60,60,60,60],"anchor":[16,16]},
};
