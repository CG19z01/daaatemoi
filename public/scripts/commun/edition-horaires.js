// Fenetre d'edition des horaires d'un lieu, partagee par la page de creation et
// la page invitee. Les horaires trouves peuvent toujours etre corriges, et un
// lieu sans horaires connus reste utilisable : rien ne bloque jamais.
import { JOURS_DE_LA_SEMAINE, horairesVides } from './horaires.js';
import { creerUneLigneDHoraires } from './ligne-horaire.js';

let fenetre = null;
let lignes = null;
let auxHorairesValides = null;

const preparerLaFenetre = () => {
  if (lignes) return;
  fenetre = document.getElementById('fenetreDesHoraires');
  const liste = document.getElementById('listeDesHoraires');
  lignes = JOURS_DE_LA_SEMAINE.map((jour) => {
    const ligne = creerUneLigneDHoraires(jour);
    liste.append(ligne.element);
    return ligne;
  });

  document.getElementById('annulerLesHoraires').addEventListener('click', () => fenetre.close());
  document.getElementById('formulaireDesHoraires').addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    const horaires = {};
    let auMoinsUnJourRenseigne = false;
    for (const [rang, jour] of JOURS_DE_LA_SEMAINE.entries()) {
      horaires[jour] = lignes[rang].lire();
      if (horaires[jour] !== null) auMoinsUnJourRenseigne = true;
    }
    fenetre.close();
    auxHorairesValides?.(auMoinsUnJourRenseigne ? horaires : null);
  });
};

// Ouvre l'edition pour un lieu et rappelle la fonction fournie avec les
// horaires corriges (ou null si plus rien n'est renseigne).
export const ouvrirLEditionDesHoraires = (lieu, auResultat) => {
  preparerLaFenetre();
  auxHorairesValides = auResultat;
  document.getElementById('titreDesHoraires').textContent = `Horaires — ${lieu.nom}`;
  const horaires = lieu.horaires ?? horairesVides();
  for (const [rang, jour] of JOURS_DE_LA_SEMAINE.entries()) lignes[rang].ecrire(horaires[jour]);
  fenetre.showModal();
};
