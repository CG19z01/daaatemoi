// Dessin d'un batiment en fausse 3D : cote droit, facade avant puis toit.
// Silhouette au trait uniquement : ni fenetre, ni porte, ni detail interieur.
import { tracerForme } from './trait.js';
import { dessinerLeToit } from './toits.js';

export const dessinerBatiment = (contexte, batiment, projection) => {
  const { x, y, largeur, profondeur, hauteur } = batiment;
  const point = (decalageX, decalageY, altitude) =>
    projection.versEcranMetrique(x + decalageX, y + decalageY, altitude);
  const epaisseur = Math.max(1, projection.echelle * 2.4);

  tracerForme(
    contexte,
    [
      point(largeur, profondeur, hauteur),
      point(largeur, 0, hauteur),
      point(largeur, 0, 0),
      point(largeur, profondeur, 0),
    ],
    epaisseur,
  );
  tracerForme(
    contexte,
    [point(0, 0, hauteur), point(largeur, 0, hauteur), point(largeur, 0, 0), point(0, 0, 0)],
    epaisseur,
  );
  dessinerLeToit(contexte, batiment, point, epaisseur);
};
