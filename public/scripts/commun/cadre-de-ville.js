// Cadrage d'une carte de ville : la zone bâtie calculée par le serveur devient
// le cadre affiché. Chaque ville a donc son propre zoom, et la projection
// l'ajuste ensuite à la taille de l'écran — un mobile n'en coupe pas les bords.
import { pivoterDesMetres, ETENDUE_PAR_DEFAUT } from '../carte/projection.js';

// Au-delà, la génération du décor coûterait cher pour des bâtiments hors champ.
const LIMITE_MAXIMALE_DU_DECOR = 5000;
const MARGE_DU_DECOR = 400;

const CADRE_PAR_DEFAUT = { centre: { x: 0, y: 0 }, etendue: ETENDUE_PAR_DEFAUT };

// La zone est en mètres bruts ; en portrait, le monde pivote d'un quart de
// tour, et le cadre doit suivre. Les deux coins opposés suffisent à le décrire.
export const cadreDeLaZone = (zone) => {
  if (!zone) return CADRE_PAR_DEFAUT;
  const premier = pivoterDesMetres(zone.minimumX, zone.minimumY);
  const second = pivoterDesMetres(zone.maximumX, zone.maximumY);
  const minimumX = Math.min(premier.x, second.x);
  const maximumX = Math.max(premier.x, second.x);
  const minimumY = Math.min(premier.y, second.y);
  const maximumY = Math.max(premier.y, second.y);
  return {
    centre: { x: (minimumX + maximumX) / 2, y: (minimumY + maximumY) / 2 },
    etendue: { largeur: maximumX - minimumX, profondeur: maximumY - minimumY },
  };
};

// Portée du décor : de quoi couvrir tout le cadre, sans aller au-delà.
export const limiteDuDecor = (cadre) => {
  const demiDiagonale =
    Math.max(
      Math.abs(cadre.centre.x) + cadre.etendue.largeur / 2,
      Math.abs(cadre.centre.y) + cadre.etendue.profondeur / 2,
    ) + MARGE_DU_DECOR;
  return Math.min(LIMITE_MAXIMALE_DU_DECOR, Math.round(demiDiagonale));
};
