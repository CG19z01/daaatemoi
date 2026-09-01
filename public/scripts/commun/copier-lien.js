// Copie d'un lien dans le presse-papier, avec un repli quand l'API Clipboard
// n'est pas disponible (navigateur ancien, page non securisee).
const DUREE_DE_LA_CONFIRMATION = 2200;

// Repli : un champ temporaire, selectionne puis copie a l'ancienne.
const copierParChampTemporaire = (texte) => {
  const champ = document.createElement('textarea');
  champ.value = texte;
  champ.setAttribute('readonly', '');
  champ.className = 'champ-de-copie';
  document.body.append(champ);
  champ.select();
  champ.setSelectionRange(0, texte.length);
  let copie = false;
  try {
    copie = document.execCommand('copy');
  } catch {
    copie = false;
  }
  champ.remove();
  return copie;
};

export const copierDansLePressePapier = async (texte) => {
  try {
    await navigator.clipboard.writeText(texte);
    return true;
  } catch {
    return copierParChampTemporaire(texte);
  }
};

// Retour visuel discret : le bouton confirme puis reprend son intitule.
export const brancherLeBoutonDeCopie = (bouton, obtenirLeTexte) => {
  const intitule = bouton.textContent;
  let attente = null;

  bouton.addEventListener('click', async () => {
    const copie = await copierDansLePressePapier(obtenirLeTexte());
    bouton.textContent = copie ? 'Lien copié ✓' : 'Copie impossible, sélectionne le lien';
    bouton.classList.toggle('est-copie', copie);
    clearTimeout(attente);
    attente = setTimeout(() => {
      bouton.textContent = intitule;
      bouton.classList.remove('est-copie');
    }, DUREE_DE_LA_CONFIRMATION);
  });
};
