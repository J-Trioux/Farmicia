/** Typographie des textes affichés ; ne pas utiliser pour les identifiants ou les fichiers. */
export function frenchText(text: string): string {
  return text
    .replace(/([\p{L}])'(?=[\p{L}])/gu, '$1’')
    .replace(/[ \u00a0\u202f]+:/g, '\u00a0:')
    .replace(/[ \u00a0\u202f]+([;!?])/g, '\u202f$1')
    .replace(/«[ \u00a0\u202f]*/g, '«\u202f')
    .replace(/[ \u00a0\u202f]*»/g, '\u202f»')
    .replace(/(\d)[ \u00a0](?=\d{3}(?:\D|$))/g, '$1\u202f');
}

export function frenchNumber(value: number): string {
  return value.toLocaleString('fr-FR').replace(/ /g, '\u202f');
}
