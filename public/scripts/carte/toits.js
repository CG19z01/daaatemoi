// Toits : plat, a deux pentes (pignon) ou a une seule pente (asymetrique).
import { tracerForme } from './trait.js';

const dessinerToitPlat = (contexte, batiment, point, epaisseur) => {
  const { largeur, profondeur, hauteur } = batiment;
  tracerForme(
    contexte,
    [
      point(0, profondeur, hauteur),
      point(largeur, profondeur, hauteur),
      point(largeur, 0, hauteur),
      point(0, 0, hauteur),
    ],
    epaisseur,
  );
};

const dessinerToitEnPignon = (contexte, batiment, point, epaisseur) => {
  const { largeur, profondeur, hauteur, toit } = batiment;
  const sommet = hauteur + toit.hauteur;
  const milieu = largeur / 2;
  const pans = [
    [point(0, profondeur, hauteur), point(milieu, profondeur, sommet), point(milieu, 0, sommet), point(0, 0, hauteur)],
    [point(milieu, profondeur, sommet), point(largeur, profondeur, hauteur), point(largeur, 0, hauteur), point(milieu, 0, sommet)],
  ];
  for (const pan of pans) tracerForme(contexte, pan, epaisseur);
  tracerForme(
    contexte,
    [point(0, 0, hauteur), point(milieu, 0, sommet), point(largeur, 0, hauteur)],
    epaisseur,
  );
};

const dessinerToitEnMonopente = (contexte, batiment, point, epaisseur) => {
  const { largeur, profondeur, hauteur, toit } = batiment;
  const sommet = hauteur + toit.hauteur;
  tracerForme(
    contexte,
    [point(0, profondeur, hauteur), point(largeur, profondeur, sommet), point(largeur, 0, sommet), point(0, 0, hauteur)],
    epaisseur,
  );
  tracerForme(
    contexte,
    [point(largeur, profondeur, sommet), point(largeur, profondeur, hauteur), point(largeur, 0, hauteur), point(largeur, 0, sommet)],
    epaisseur,
  );
  tracerForme(
    contexte,
    [point(0, 0, hauteur), point(largeur, 0, sommet), point(largeur, 0, hauteur)],
    epaisseur,
  );
};

const DESSINATEURS_DE_TOITS = {
  plat: dessinerToitPlat,
  pignon: dessinerToitEnPignon,
  monopente: dessinerToitEnMonopente,
};

export const dessinerLeToit = (contexte, batiment, point, epaisseur) => {
  const dessinateur = DESSINATEURS_DE_TOITS[batiment.toit.type] ?? dessinerToitPlat;
  dessinateur(contexte, batiment, point, epaisseur);
};
