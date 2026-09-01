// Une journee dans l'editeur d'horaires : son etat (non renseigne, ferme,
// ouvert) et jusqu'a deux plages d'ouverture. Les minutes restent multiples de
// cinq, comme dans tous les selecteurs du site.
import { libelleDuJour } from './horaires.js';
import { PAS_DES_MINUTES, enMinutes, enHeure } from './creneaux.js';

const PLAGES_PAR_JOUR = 2;
const ETAT_INCONNU = 'inconnu';
const ETAT_FERME = 'ferme';
const ETAT_OUVERT = 'ouvert';

const ETATS = [
  [ETAT_INCONNU, 'Non renseignés'],
  [ETAT_FERME, 'Fermé'],
  [ETAT_OUVERT, 'Ouvert'],
];

const arrondirAuPas = (heure) =>
  heure ? enHeure(Math.round(enMinutes(heure) / PAS_DES_MINUTES) * PAS_DES_MINUTES) : '';

const creerUnChampHeure = (intitule) => {
  const champ = document.createElement('input');
  champ.type = 'time';
  champ.step = String(PAS_DES_MINUTES * 60);
  champ.className = 'champ-heure';
  champ.setAttribute('aria-label', intitule);
  // Une saisie au clavier hors du pas est ramenee sur le multiple le plus proche.
  champ.addEventListener('change', () => {
    champ.value = arrondirAuPas(champ.value);
  });
  return champ;
};

const creerUnSelecteurDEtat = (jour) => {
  const champ = document.createElement('select');
  champ.className = 'etat-du-jour';
  champ.setAttribute('aria-label', `État du ${jour}`);
  for (const [valeur, intitule] of ETATS) {
    const option = document.createElement('option');
    option.value = valeur;
    option.textContent = intitule;
    champ.append(option);
  }
  return champ;
};

export const creerUneLigneDHoraires = (jour) => {
  const element = document.createElement('li');
  element.className = 'ligne-horaire';

  const nom = document.createElement('span');
  nom.className = 'jour';
  nom.textContent = libelleDuJour(jour);

  const etat = creerUnSelecteurDEtat(jour);
  const plages = document.createElement('div');
  plages.className = 'plages-du-jour';

  const champs = [];
  for (let numero = 1; numero <= PLAGES_PAR_JOUR; numero += 1) {
    const ouverture = creerUnChampHeure(`Ouverture ${numero} — ${jour}`);
    const fermeture = creerUnChampHeure(`Fermeture ${numero} — ${jour}`);
    const paire = document.createElement('span');
    paire.className = 'plage';
    const tiret = document.createElement('span');
    tiret.textContent = '–';
    paire.append(ouverture, tiret, fermeture);
    plages.append(paire);
    champs.push({ ouverture, fermeture });
  }

  const afficherLesPlages = () => {
    plages.hidden = etat.value !== ETAT_OUVERT;
  };
  etat.addEventListener('change', afficherLesPlages);

  element.append(nom, etat, plages);

  const ecrire = (horairesDuJour) => {
    for (const paire of champs) {
      paire.ouverture.value = '';
      paire.fermeture.value = '';
    }
    if (!Array.isArray(horairesDuJour)) etat.value = ETAT_INCONNU;
    else if (horairesDuJour.length === 0) etat.value = ETAT_FERME;
    else {
      etat.value = ETAT_OUVERT;
      horairesDuJour.slice(0, PLAGES_PAR_JOUR).forEach((plage, rang) => {
        champs[rang].ouverture.value = arrondirAuPas(plage.ouverture);
        champs[rang].fermeture.value = arrondirAuPas(plage.fermeture);
      });
    }
    afficherLesPlages();
  };

  // Une plage incomplete ou de duree nulle est simplement ignoree.
  const lire = () => {
    if (etat.value === ETAT_INCONNU) return null;
    if (etat.value === ETAT_FERME) return [];
    return champs
      .filter((paire) => paire.ouverture.value && paire.fermeture.value)
      .filter((paire) => paire.ouverture.value !== paire.fermeture.value)
      .map((paire) => ({ ouverture: paire.ouverture.value, fermeture: paire.fermeture.value }));
  };

  return { element, ecrire, lire };
};
