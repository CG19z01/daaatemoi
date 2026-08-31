// Orchestration de la page carte : rendu fixe, outils de coloriage et reservation.
import {
  creerProjection,
  versMetres,
  aDesCoordonnees,
  calculerLeCadre,
  definirLOrientationDuMonde,
} from './projection.js';
import { construireDecor } from './decor.js';
import { chargerLeFondDeCarte, orienterLeFond } from './fond-de-carte.js';
import { dessinerLaCarte } from './rendu.js';
import { creerColoration } from './coloration.js';
import { creerLesMarqueurs } from './marqueurs.js';
import { creerLesMarqueursProposes } from './marqueurs-proposes.js';
import { brancherLePlacement } from './placement.js';
import { recupererLesLieux, journaliserLeClic } from './api.js';
import { afficherLaFiche, masquerLaFiche, brancherLaFermeture, brancherLeBoutonReserverIci } from './fiche.js';
import { preparerLaReservation, ouvrirLaReservation } from './reservation.js';
import { brancherLAutreEndroit } from './autre-endroit.js';
import { brancherLaColoration } from './interactions.js';
import { brancherLesOutils } from './outils.js';
import { preparerLeMenu, brancherLeMenu } from './menus.js';
import { brancherLeDessinPartage, chargerLeDessin } from './dessin-partage.js';
import { brancherLesAnnotations } from './annotations.js';

const RATIO_MAXIMUM = 2;
const scene = document.getElementById('scene');
const canvasCarte = document.getElementById('canvasCarte');
const contexteCarte = canvasCarte.getContext('2d');
const canvasColoration = document.getElementById('canvasColoration');
const coloration = creerColoration(canvasColoration);

let projection = null;
let decor = null;
let fondDeCarte = null;
let fondBrut = null;
let lesLieux = [];
let cadre = null;
let enPortrait = null;
let marqueurs = null;
let marqueursProposes = null;
let lieuSelectionne = null;

// Le monde pivote d'un quart de tour en portrait : decor et cadre sont refaits.
const preparerLOrientation = (portrait) => {
  if (enPortrait === portrait) return;
  enPortrait = portrait;
  definirLOrientationDuMonde(portrait);
  fondDeCarte = orienterLeFond(fondBrut, portrait);
  cadre = calculerLeCadre(lesLieux);
  decor = construireDecor(fondDeCarte, lesLieux.filter(aDesCoordonnees).map(versMetres));
};

const redimensionner = () => {
  const largeur = scene.clientWidth;
  const hauteur = scene.clientHeight;
  preparerLOrientation(hauteur > largeur);
  const ratio = Math.min(window.devicePixelRatio || 1, RATIO_MAXIMUM);
  canvasCarte.width = Math.round(largeur * ratio);
  canvasCarte.height = Math.round(hauteur * ratio);
  contexteCarte.setTransform(ratio, 0, 0, ratio, 0, 0);
  projection = creerProjection(largeur, hauteur, cadre);
  // Les traits sont rejoues depuis leurs coordonnees : nets a toute echelle.
  coloration.redimensionner(largeur, hauteur, ratio, projection);
  dessinerLaCarte(contexteCarte, fondDeCarte, decor, projection, { largeur, hauteur });
  marqueurs.repositionner(projection);
  marqueursProposes.repositionner(projection);
};

// Le clic sur un point ouvre seulement sa fiche : la carte n'est jamais coloriee ici.
const auClicSurUnLieu = async (lieu) => {
  lieuSelectionne = lieu;
  marqueurs.selectionner(lieu.identifiant);
  afficherLaFiche(lieu);
  preparerLeMenu(lieu);
  try {
    await journaliserLeClic(lieu.identifiant);
  } catch {
    // Le journal est secondaire : la fiche reste affichee meme en cas d'echec.
  }
};

const brancherLesBoutons = () => {
  brancherLaFermeture(() => {
    lieuSelectionne = null;
    marqueurs.selectionner(null);
  });
  brancherLeBoutonReserverIci(() => ouvrirLaReservation(lieuSelectionne));
  brancherLeMenu(() => lieuSelectionne);
  brancherLAutreEndroit((lieuPropose) => marqueursProposes.ajouter(lieuPropose));
};

const demarrer = async () => {
  const [lieux, fond] = await Promise.all([recupererLesLieux(), chargerLeFondDeCarte()]);
  const { listeDesLieux, lieuxProposes } = lieux;
  lesLieux = listeDesLieux;
  fondBrut = fond;
  const couche = document.getElementById('coucheMarqueurs');
  marqueurs = creerLesMarqueurs(couche, listeDesLieux, auClicSurUnLieu);
  marqueursProposes = creerLesMarqueursProposes(couche, lieuxProposes);
  preparerLaReservation(listeDesLieux);
  brancherLesBoutons();
  brancherLaColoration(scene, coloration);
  brancherLePlacement(scene, () => projection);
  brancherLesOutils(coloration);
  brancherLesAnnotations();
  redimensionner();
  brancherLeDessinPartage(coloration);
  coloration.ajouterDesTraits(await chargerLeDessin());

  let attenteDeRedimensionnement = null;
  window.addEventListener('resize', () => {
    clearTimeout(attenteDeRedimensionnement);
    attenteDeRedimensionnement = setTimeout(redimensionner, 150);
  });
};

masquerLaFiche();
demarrer().catch(() => {
  const message = document.getElementById('messageCarte');
  message.textContent = 'La carte n’est pas disponible pour le moment.';
  message.hidden = false;
});
