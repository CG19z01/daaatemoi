// Jeu d'essai : une ville et un fond de carte fictifs, ecrits directement dans
// l'entrepot. Les tests n'appellent donc aucun service exterieur.
import { JOURS_DE_LA_SEMAINE } from '../serveur/utilitaires/jours.js';

export const VILLE_DE_TEST = {
  cle: 'ville-de-test',
  nom: 'Ville de test',
  pays: 'Testland',
  latitude: 49.4404591,
  longitude: 1.0939658,
  rayon: 1800,
  etendue: { largeur: 1800, profondeur: 1400 },
};

export const FOND_DE_TEST = {
  source: 'jeu d essai',
  repere: 'm',
  version: 2,
  centre: { latitude: VILLE_DE_TEST.latitude, longitude: VILLE_DE_TEST.longitude },
  zone: { minimumX: -900, maximumX: 900, minimumY: -700, maximumY: 700 },
  riviere: [{ largeur: 90, points: [[-800, 0], [800, 120]] }],
  voiesPrincipales: [[[-600, -400], [600, 400]]],
  voiesSecondaires: [[[-300, 300], [300, -300]]],
  parcs: [[[100, 100], [200, 100], [200, 200], [100, 200], [100, 100]]],
};

export const semerLaVille = async (entrepot) => {
  await entrepot.ecrireDocument(`ville-${VILLE_DE_TEST.cle}`, VILLE_DE_TEST);
  await entrepot.ecrireDocument(`carte-ville-${VILLE_DE_TEST.cle}`, FOND_DE_TEST);
};

// Memes horaires tous les jours : le jour de la semaine n'influe pas sur le test.
export const horairesTousLesJours = (plages) =>
  Object.fromEntries(JOURS_DE_LA_SEMAINE.map((jour) => [jour, plages]));

// Date du lendemain a Paris, au format AAAA-MM-JJ.
export const demain = () => {
  const instant = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
};

const lieu = (nom, plages, x, y) => ({
  nom,
  adresse: `${x} rue du Test`,
  categorie: 'bar',
  reference: `osm-node-${x}`,
  horaires: plages ? horairesTousLesJours(plages) : null,
  point: { x, y },
});

// Trois lieux : un ouvert 10h-22h, un ouvert en deux fois, un sans horaires.
export const lieuxDeTest = () => [
  lieu('Café du Test', [{ ouverture: '10:00', fermeture: '22:00' }], 120, -60),
  lieu('Bar de la Nuit', [
    { ouverture: '10:00', fermeture: '14:00' },
    { ouverture: '18:00', fermeture: '23:00' },
  ], -240, 310),
  lieu('Lieu sans horaires', null, 40, 400),
];

export const experienceDeTest = (options = {}) => ({
  villeCle: VILLE_DE_TEST.cle,
  lieux: lieuxDeTest(),
  disponibilites: [
    { date: demain(), heureDeDebut: '08:00', heureDeFin: '09:00', indexDuLieu: 0 },
    { date: demain(), heureDeDebut: '19:00', heureDeFin: '21:00', indexDuLieu: 1 },
  ],
  motDePasse: 'mot-de-passe-solide',
  confirmationDuMotDePasse: 'mot-de-passe-solide',
  ...options,
});
