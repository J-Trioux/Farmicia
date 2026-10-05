/**
 * Publication sur GitHub Pages.
 *
 * `vinext build` écrit un site statique dans `dist/client`, avec des chemins
 * absolus (`/assets/…`, `/_next/…`). Sur une page de projet, le site est servi
 * sous `/<nom-du-depot>/` : ce script réécrit ces chemins après la compilation.
 *
 *   node .github/scripts/pages-base.mjs dist/client /Farmicia
 *
 * Sans second argument, le site est préparé pour la racine d’un domaine
 * (page utilisateur ou domaine personnalisé) et rien n’est réécrit.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.argv[2] || 'dist/client';
const base = (process.argv[3] || '').replace(/\/$/, '');
const TEXT = ['.html', '.js', '.mjs', '.css', '.json', '.rsc', '.txt'];
// Chemins absolus du site, précédés d’un guillemet, d’une parenthèse ou d’un égal.
const ABSOLUTE = /(["'`(=])\/(assets|_next|favicon\.svg|index\.rsc)/g;
// Entrées du manifeste de préchargement, écrites sans barre oblique initiale.
const MANIFEST = /(["'])_next\/static\//g;

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

if (!base) {
  console.log('Site préparé pour la racine : aucune réécriture.');
} else {
  let changed = 0;
  for await (const path of files(root)) {
    if (!TEXT.some((ext) => path.endsWith(ext))) continue;
    const source = await readFile(path, 'utf8');
    const result = source
      .replace(ABSOLUTE, (_, quote, name) => `${quote}${base}/${name}`)
      .replace(MANIFEST, (_, quote) => `${quote}${base.slice(1)}/_next/static/`);
    if (result !== source) {
      await writeFile(path, result);
      changed++;
    }
  }
  console.log(`Base « ${base} » appliquée à ${changed} fichier(s).`);
}

// GitHub Pages ignore les dossiers commençant par « _ » sans ce fichier.
await writeFile(join(root, '.nojekyll'), '');
await stat(join(root, 'index.html'));
console.log('Site prêt :', root);
