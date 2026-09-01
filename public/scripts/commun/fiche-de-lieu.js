// Fiche d'un lieu dans un panneau : nom et adresse modifiables, resume des
// horaires, et les actions disponibles. Une action absente ne cree pas de
// bouton : la meme fiche sert donc au createur et a l'invite.
import { resumeDesHoraires } from './horaires.js';

const creerUnChampTexte = (valeur, intitule, longueurMaximale, auChangement) => {
  const champ = document.createElement('input');
  champ.type = 'text';
  champ.value = valeur ?? '';
  champ.maxLength = longueurMaximale;
  champ.placeholder = intitule;
  champ.setAttribute('aria-label', intitule);
  champ.className = 'champ-du-lieu';
  champ.addEventListener('change', () => auChangement(champ.value));
  return champ;
};

const creerUnBouton = (intitule, classe, action) => {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = `bouton bouton-${classe} action-du-lieu`;
  bouton.textContent = intitule;
  bouton.addEventListener('click', action);
  return bouton;
};

export const creerUneFicheDeLieu = (lieu, actions = {}) => {
  const element = document.createElement('li');
  element.className = lieu.point ? 'fiche-de-lieu est-placee' : 'fiche-de-lieu';

  if (actions.auNomModifie) {
    element.append(
      creerUnChampTexte(lieu.nom, 'Nom du lieu', 80, (nom) => actions.auNomModifie({ nom })),
      creerUnChampTexte(lieu.adresse, 'Adresse (facultative)', 120, (adresse) =>
        actions.auNomModifie({ adresse }),
      ),
    );
  } else {
    const nom = document.createElement('strong');
    nom.textContent = lieu.nom;
    const adresse = document.createElement('span');
    adresse.className = 'adresse-du-lieu';
    adresse.textContent = lieu.adresse || 'Aucune adresse connue';
    element.append(nom, adresse);
  }

  const horaires = document.createElement('span');
  horaires.className = 'horaires-du-lieu';
  horaires.textContent = resumeDesHoraires(lieu.horaires);
  element.append(horaires);

  const boutons = document.createElement('div');
  boutons.className = 'actions-du-lieu';
  if (actions.auPlacement) {
    boutons.append(
      creerUnBouton(
        lieu.point ? 'Placé ✓ — replacer' : 'Placer sur la carte',
        'contour',
        actions.auPlacement,
      ),
    );
  }
  if (actions.auxHoraires) boutons.append(creerUnBouton('Horaires', 'contour', actions.auxHoraires));
  if (actions.auRetrait) boutons.append(creerUnBouton('Supprimer', 'contour', actions.auRetrait));
  if (boutons.childElementCount > 0) element.append(boutons);

  return element;
};
