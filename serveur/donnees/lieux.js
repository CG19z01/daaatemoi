// Source unique des lieux. Les coordonnees servent uniquement a placer les
// marqueurs : elles ne sont jamais affichees dans l'interface publique.
//
// horaires : une entree par jour, avec l'une des trois valeurs suivantes
//   { ouverture: '18:00', fermeture: '02:00' }  -> une fermeture plus petite passe minuit
//   FERME                                       -> etablissement ferme ce jour-la
//   HORAIRES_NON_RENSEIGNES                     -> information non fournie, rien n'est invente
//
// menu : ressource ouverte au clic sur le point
//   { type: 'image', fichier: 'Nom-Du-Fichier.jpg' }  -> image rangee dans donnees/
//   { type: 'image', fichier: null }                  -> photo pas encore disponible
//   { type: 'lien', adresse: 'https://...' }          -> site du lieu

export const FERME = 'ferme';
export const HORAIRES_NON_RENSEIGNES = 'nonRenseigne';

export const listeDesLieux = [
  {
    identifiant: 'snooker-bowling-bar',
    nom: 'Snooker Bowling',
    // Interne : Snooker Bowl, quai Ferdinand de Lesseps (Plus Code C3V9+PV).
    latitude: 49.444312,
    longitude: 1.069688,
    activite: 'Bowling, Fléchettes, Billard',
    horaires: {
      lundi: { ouverture: '15:00', fermeture: '01:00' },
      mardi: { ouverture: '15:00', fermeture: '01:00' },
      mercredi: { ouverture: '15:00', fermeture: '01:00' },
      jeudi: { ouverture: '15:00', fermeture: '00:00' },
      vendredi: { ouverture: '18:00', fermeture: '00:00' },
      samedi: { ouverture: '14:00', fermeture: '02:00' },
      dimanche: { ouverture: '14:00', fermeture: '00:00' },
    },
    // Photo de la carte pas encore fournie : deposer le fichier dans donnees/
    // puis renseigner son nom ici pour que le point l'ouvre.
    menu: { type: 'image', fichier: null },
  },
  {
    identifiant: 'jeu-de-societe-bar',
    nom: 'QG des Advenjoueurs',
    // Plus Code interne du lieu : C3VV+7C.
    latitude: 49.443187,
    longitude: 1.093562,
    activite: 'Jeux de societe et un verre',
    horaires: {
      lundi: HORAIRES_NON_RENSEIGNES,
      mardi: { ouverture: '14:30', fermeture: '01:00' },
      mercredi: { ouverture: '14:30', fermeture: '01:00' },
      jeudi: { ouverture: '14:30', fermeture: '01:00' },
      vendredi: { ouverture: '14:30', fermeture: '01:00' },
      samedi: { ouverture: '12:00', fermeture: '01:00' },
      dimanche: { ouverture: '14:30', fermeture: '01:00' },
    },
    menu: { type: 'lien', adresse: 'https://qgdesavenjoueurs.fr/la-carte/' },
  },
  {
    identifiant: 'bar-edo',
    nom: 'Bar Edo',
    // Interne : Edo, rue de la Vicomte (Plus Code C3RQ+99).
    latitude: 49.440937,
    longitude: 1.088438,
    activite: 'Bar japonais',
    horaires: {
      lundi: FERME,
      mardi: { ouverture: '18:00', fermeture: '02:00' },
      mercredi: { ouverture: '18:00', fermeture: '02:00' },
      jeudi: { ouverture: '18:00', fermeture: '02:00' },
      vendredi: { ouverture: '18:00', fermeture: '02:00' },
      samedi: { ouverture: '18:00', fermeture: '02:00' },
      dimanche: FERME,
    },
    cuisine: { ouverture: '18:30', fermeture: '22:30' },
    menu: { type: 'image', fichier: 'Carte-Edo.jpg' },
  },
];

export const trouverLieu = (identifiant) =>
  listeDesLieux.find((lieu) => lieu.identifiant === identifiant) ?? null;

// Fichiers de cartes autorises a etre servis : rien d'autre n'est accessible.
export const cartesDisponibles = () =>
  new Set(
    listeDesLieux
      .filter((lieu) => lieu.menu?.type === 'image' && lieu.menu.fichier)
      .map((lieu) => lieu.menu.fichier),
  );
