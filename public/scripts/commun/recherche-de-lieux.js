// Fenetre de recherche d'un lieu reel dans la ville choisie. La recherche est
// faite par le serveur (OpenStreetMap) : le navigateur ne detient aucune cle.
// Un lieu absent des donnees peut toujours etre ajoute a la main.
import { appeler } from './appels.js';
import { resumeDesHoraires } from './horaires.js';

const LONGUEUR_MINIMALE = 2;

let elements = null;
let auLieuChoisi = null;
let cleDeLaVille = '';

const decrire = (lieu) =>
  [lieu.categorie, lieu.adresse].filter(Boolean).join(' · ') || 'Aucune adresse connue';

const creerUnResultat = (lieu) => {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'resultat-de-recherche';

  const nom = document.createElement('strong');
  nom.textContent = lieu.nom;
  const details = document.createElement('span');
  details.textContent = decrire(lieu);
  const horaires = document.createElement('em');
  horaires.textContent = lieu.horairesTrouves
    ? resumeDesHoraires(lieu.horaires)
    : 'Horaires à compléter';

  bouton.append(nom, details, horaires);
  bouton.addEventListener('click', () => {
    elements.fenetre.close();
    auLieuChoisi?.(lieu);
  });
  return bouton;
};

const afficher = (texte) => {
  elements.message.textContent = texte;
};

const lancerLaRecherche = async (terme) => {
  elements.resultats.replaceChildren();
  afficher('Recherche...');
  try {
    const parametres = new URLSearchParams({ ville: cleDeLaVille, recherche: terme });
    const { lieux } = await appeler(`/api/creation/lieux?${parametres}`);
    elements.resultats.append(...(lieux ?? []).map(creerUnResultat));
    afficher(lieux?.length ? '' : 'Aucun lieu trouvé. Tu peux l’ajouter à la main.');
  } catch (erreur) {
    afficher(erreur.message);
  }
};

// Lieu saisi a la main : seul le nom est connu, les horaires viendront ensuite.
const ajouterALaMain = () => {
  const nom = elements.champ.value.trim();
  if (nom.length < LONGUEUR_MINIMALE) return afficher('Écris au moins deux lettres.');
  elements.fenetre.close();
  return auLieuChoisi?.({ nom, adresse: '', categorie: '', reference: null, horaires: null });
};

const preparerLaFenetre = () => {
  if (elements) return;
  elements = {
    fenetre: document.getElementById('fenetreDeRecherche'),
    formulaire: document.getElementById('formulaireDeRecherche'),
    champ: document.getElementById('champRecherche'),
    resultats: document.getElementById('resultatsDeRecherche'),
    message: document.getElementById('messageDeRecherche'),
  };
  elements.formulaire.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    const terme = elements.champ.value.trim();
    if (terme.length < LONGUEUR_MINIMALE) return afficher('Écris au moins deux lettres.');
    return lancerLaRecherche(terme);
  });
  document.getElementById('annulerLaRecherche').addEventListener('click', () =>
    elements.fenetre.close(),
  );
  document.getElementById('ajouterALaMain').addEventListener('click', ajouterALaMain);
};

export const ouvrirLaRecherche = (cleDeLaVilleChoisie, auResultat) => {
  preparerLaFenetre();
  cleDeLaVille = cleDeLaVilleChoisie;
  auLieuChoisi = auResultat;
  elements.champ.value = '';
  elements.resultats.replaceChildren();
  afficher('');
  elements.fenetre.showModal();
};
