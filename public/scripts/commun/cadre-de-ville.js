// Cadrage d'une carte de ville : la zone bâtie calculée par le serveur devient
// le cadre affiché. Chaque ville a donc son propre zoom, et la projection
// l'ajuste ensuite à la taille de l'écran — un mobile n'en coupe pas les bords.
import { pivoterDesMetres, ETENDUE_PAR_DEFAUT } from '../carte/projection.js';

// Au-delà, la génération du décor coûterait cher pour des bâtiments hors champ.
const LIMITE_MAXIMALE_DU_DECOR = 5200;
const MARGE_DU_DECOR = 400;
// Marge autour de la ville, pour qu'elle ne vienne pas coller aux bords.
const MARGE_DU_CADRE = 1.08;
// Retrait par rapport au bord des données, pour n'en jamais montrer la limite.
const MARGE_DE_SECURITE = 0.96;

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
    etendue: {
      largeur: (maximumX - minimumX) * MARGE_DU_CADRE,
      profondeur: (maximumY - minimumY) * MARGE_DU_CADRE,
    },
  };
};

// Portée du décor : de quoi couvrir tout ce que l'écran peut montrer de la
// carte, c'est-à-dire le cadre de la ville, mais aussi les abords jusqu'à la
// limite des données. Au-delà commence la hachure, où l'on ne bâtit pas.
export const limiteDuDecor = (cadre, porteeDesDonnees = 0) => {
  const besoinDuCadre =
    Math.max(
      Math.abs(cadre.centre.x) + cadre.etendue.largeur / 2,
      Math.abs(cadre.centre.y) + cadre.etendue.profondeur / 2,
    ) + MARGE_DU_DECOR;
  return Math.min(LIMITE_MAXIMALE_DU_DECOR, Math.round(Math.max(besoinDuCadre, porteeDesDonnees)));
};

// Resserre le cadre jusqu'à ce que l'écran ne montre plus rien au-delà des
// données. Sans cela, le format de l'écran finit toujours par déborder de la
// zone extraite, et l'on aperçoit le bord de la carte.
//
// Le calcul est direct : réduire l'étendue d'un facteur k rapproche d'autant
// les coins de l'écran du centre. On cherche donc le plus grand k qui les
// garde tous à l'intérieur, et l'on n'agrandit jamais — la ville reste cadrée
// au mieux quand elle tient déjà.
export const restreindreAuxDonnees = (cadre, portee, projection, largeur, hauteur) => {
  if (!portee || !Number.isFinite(portee)) return cadre;
  // On s'arrête un peu avant la limite : sur le bord exact, les données sont
  // déjà clairsemées, et l'arrondi suffirait à laisser paraître le vide.
  const atteignable = portee * MARGE_DE_SECURITE;

  const coins = [[0, 0], [largeur, 0], [0, hauteur], [largeur, hauteur]].map((point) =>
    projection.versMetriqueDepuisEcran(point[0], point[1]),
  );

  let facteur = 1;
  for (const coin of coins) {
    for (const [centre, position] of [
      [cadre.centre.x, coin.x],
      [cadre.centre.y, coin.y],
    ]) {
      const ecart = position - centre;
      if (Math.abs(ecart) < 1) continue;
      const limite = ecart > 0 ? atteignable - centre : -atteignable - centre;
      facteur = Math.min(facteur, limite / ecart);
    }
  }

  if (facteur >= 1) return cadre;
  return {
    centre: cadre.centre,
    etendue: {
      largeur: cadre.etendue.largeur * facteur,
      profondeur: cadre.etendue.profondeur * facteur,
    },
  };
};
