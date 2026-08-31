// Fiche d'information affichee au clic sur un lieu.
// Les coordonnees restent internes : elles ne sont jamais affichees ici.
import {
  JOURS_DE_LA_SEMAINE,
  libelleDuJour,
  libelleDeLHoraire,
  formaterUneHeure,
} from './horaires.js';

const fiche = document.getElementById('fiche');
const nom = document.getElementById('ficheNom');
const activite = document.getElementById('ficheActivite');
const horaires = document.getElementById('ficheHoraires');
const cuisine = document.getElementById('ficheCuisine');

// Une ligne par jour : nom du jour puis horaire, dans l'ordre de la semaine.
const remplirLesHoraires = (lieu) => {
  horaires.replaceChildren();
  for (const jour of JOURS_DE_LA_SEMAINE) {
    const nomDuJour = document.createElement('dt');
    nomDuJour.textContent = libelleDuJour(jour);
    const horaireDuJour = document.createElement('dd');
    horaireDuJour.textContent = libelleDeLHoraire(lieu.horaires?.[jour]);
    horaires.append(nomDuJour, horaireDuJour);
  }
};

const afficherLesHorairesDeCuisine = (lieu) => {
  cuisine.hidden = !lieu.cuisine;
  if (!lieu.cuisine) return;
  cuisine.textContent = `Cuisine : ${formaterUneHeure(lieu.cuisine.ouverture)} - ${formaterUneHeure(lieu.cuisine.fermeture)}`;
};

export const afficherLaFiche = (lieu) => {
  nom.textContent = lieu.nom;
  activite.textContent = lieu.activite;
  remplirLesHoraires(lieu);
  afficherLesHorairesDeCuisine(lieu);
  fiche.hidden = false;
};

export const masquerLaFiche = () => {
  fiche.hidden = true;
};

export const brancherLaFermeture = (auClicSurFermer) => {
  document.getElementById('fermerFiche').addEventListener('click', () => {
    masquerLaFiche();
    auClicSurFermer();
  });
};

export const brancherLeBoutonReserverIci = (auClic) => {
  document.getElementById('reserverIci').addEventListener('click', auClic);
};
