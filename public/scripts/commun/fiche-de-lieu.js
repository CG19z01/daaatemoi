// Fiche d'un lieu dans un panneau : nom et adresse modifiables, resume des
// horaires, et les actions disponibles. Une action absente ne cree pas de
// bouton : la meme fiche sert donc au createur et a l'invite.
import { resumeDesHoraires } from './horaires.js';

const COULEUR_PAR_DEFAUT = '#a30dad';

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

// Choix de la couleur du point : un bouton qui ouvre la palette du navigateur,
// avec un aperçu immédiat. Rien à voir avec la couleur du feutre.
const creerLeChoixDeLaCouleur = (lieu, auChangement) => {
  const cadre = document.createElement('span');
  cadre.className = 'cadre-des-couleurs couleur-du-point';

  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'outil outil-couleur';
  bouton.setAttribute('aria-label', `Couleur du point de ${lieu.nom}`);
  bouton.style.backgroundColor = lieu.couleur ?? COULEUR_PAR_DEFAUT;

  const champ = document.createElement('input');
  champ.type = 'color';
  champ.className = 'champ-de-la-couleur';
  champ.value = lieu.couleur ?? COULEUR_PAR_DEFAUT;
  champ.tabIndex = -1;
  champ.setAttribute('aria-hidden', 'true');

  bouton.addEventListener('click', () => {
    if (typeof champ.showPicker === 'function') champ.showPicker();
    else champ.click();
  });
  // L'aperçu suit la palette ; l'enregistrement attend le choix définitif.
  champ.addEventListener('input', () => {
    bouton.style.backgroundColor = champ.value;
  });
  champ.addEventListener('change', () => auChangement(champ.value));

  cadre.append(bouton, champ);
  return cadre;
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
  if (actions.auCouleurModifiee) {
    boutons.append(creerLeChoixDeLaCouleur(lieu, actions.auCouleurModifiee));
  }
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
