// Points proposes sur la carte : affichage et retrait depuis l'administration.
import { enDateFrancaise } from './dates.js';

const corpsDuTableau = () => document.getElementById('corpsDesLieuxProposes');

const ajouterUneCellule = (ligne, texte) => {
  ligne.insertCell().textContent = texte;
};

const cellulePleine = (ligne, element) => {
  ligne.insertCell().append(element);
};

const creerLaPastille = (couleur) => {
  const pastille = document.createElement('span');
  pastille.className = 'pastille-de-couleur';
  pastille.style.backgroundColor = couleur;
  pastille.title = couleur;
  return pastille;
};

const creerLeBoutonDeRetrait = (lieu, auRetrait) => {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'bouton bouton-contour bouton-retirer';
  bouton.textContent = 'Retirer';
  bouton.addEventListener('click', () => auRetrait(lieu));
  return bouton;
};

export const afficherLesPointsProposes = (lieuxProposes, auRetrait) => {
  const corps = corpsDuTableau();
  corps.replaceChildren();
  if (lieuxProposes.length === 0) {
    const ligne = corps.insertRow();
    const cellule = ligne.insertCell();
    cellule.colSpan = 4;
    cellule.textContent = 'Aucun point proposé sur la carte.';
    return;
  }
  for (const lieu of lieuxProposes) {
    const ligne = corps.insertRow();
    ajouterUneCellule(ligne, lieu.nom);
    ajouterUneCellule(ligne, `${enDateFrancaise(lieu.dateProposee)} à ${lieu.heureProposee}`);
    cellulePleine(ligne, creerLaPastille(lieu.couleur));
    cellulePleine(ligne, creerLeBoutonDeRetrait(lieu, auRetrait));
  }
};
