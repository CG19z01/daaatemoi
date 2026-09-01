// Fenetre de choix d'un creneau : une date, un lieu facultatif, une heure de
// debut et une heure de fin. Les heures proposees suivent les horaires du lieu
// choisi ce jour-la, et les minutes vont toujours de 5 en 5.
import { creerSelecteurDHeure } from './selecteur-heure.js';
import { nomDuJourDeLaDate } from './creneaux.js';

let elements = null;
let debut = null;
let fin = null;
let lieuxProposes = [];
let auCreneauValide = null;

const lieuChoisi = () =>
  lieuxProposes.find((lieu) => lieu.valeur === elements.lieu.value) ?? null;

const horairesDuJourChoisi = () => {
  const lieu = lieuChoisi();
  if (!lieu?.horaires || !elements.date.value) return null;
  return lieu.horaires[nomDuJourDeLaDate(elements.date.value)] ?? null;
};

// Un lieu ferme ce jour-la ne propose aucune heure : on le dit, sans bloquer
// l'utilisateur ailleurs que sur ce couple date / lieu.
// Sans creneau fourni, les heures deja choisies sont conservees si elles restent
// valables : changer de date ne fait pas perdre l'heure saisie.
const rafraichirLesHeures = (creneau) => {
  const souhaite = creneau ?? { heureDeDebut: debut.valeur(), heureDeFin: fin.valeur() };
  const horaires = horairesDuJourChoisi();
  debut.definirLesHoraires(horaires, souhaite.heureDeDebut);
  fin.definirLesHoraires(horaires, souhaite.heureDeFin);
  const ferme = debut.estIndisponible();
  elements.message.textContent = ferme ? 'Ce lieu est fermé ce jour-là.' : '';
  elements.valider.disabled = ferme;
};

const remplirLesLieux = (valeurChoisie) => {
  elements.lieu.replaceChildren();
  for (const lieu of [{ valeur: '', nom: 'Peu importe' }, ...lieuxProposes]) {
    const option = document.createElement('option');
    option.value = lieu.valeur;
    option.textContent = lieu.nom;
    elements.lieu.append(option);
  }
  elements.lieu.value = valeurChoisie ?? '';
};

const preparerLaFenetre = () => {
  if (elements) return;
  elements = {
    fenetre: document.getElementById('fenetreDeCreneau'),
    titre: document.getElementById('titreDuCreneau'),
    formulaire: document.getElementById('formulaireDuCreneau'),
    date: document.getElementById('champDateDuCreneau'),
    lieu: document.getElementById('champLieuDuCreneau'),
    message: document.getElementById('messageDuCreneau'),
    valider: document.getElementById('validerLeCreneau'),
  };
  debut = creerSelecteurDHeure(
    document.getElementById('champHeureDeDebut'),
    document.getElementById('champMinuteDeDebut'),
  );
  fin = creerSelecteurDHeure(
    document.getElementById('champHeureDeFin'),
    document.getElementById('champMinuteDeFin'),
  );

  elements.date.addEventListener('change', () => rafraichirLesHeures());
  elements.lieu.addEventListener('change', () => rafraichirLesHeures());
  document.getElementById('annulerLeCreneau').addEventListener('click', () =>
    elements.fenetre.close(),
  );
  elements.formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    if (!elements.date.value) {
      elements.message.textContent = 'Choisis une date.';
      return;
    }
    elements.fenetre.close();
    auCreneauValide?.({
      date: elements.date.value,
      heureDeDebut: debut.valeur(),
      heureDeFin: fin.valeur(),
      valeurDuLieu: elements.lieu.value || null,
    });
  });
};

// aujourdHui au format AAAA-MM-JJ : aucune date passee ne peut etre choisie.
const aujourdHui = () =>
  new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

export const ouvrirLaFenetreDeCreneau = ({ titre, lieux, creneau = {}, auResultat }) => {
  preparerLaFenetre();
  lieuxProposes = lieux;
  auCreneauValide = auResultat;
  elements.titre.textContent = titre;
  elements.date.min = aujourdHui();
  elements.date.value = creneau.date ?? '';
  remplirLesLieux(creneau.valeurDuLieu);
  rafraichirLesHeures(creneau);
  elements.fenetre.showModal();
};
