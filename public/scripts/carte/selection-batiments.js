// Choix aleatoire mais coherent d'un modele : pas de repetition immediate
// et les immeubles restent espaces au milieu des maisons.
import { CATALOGUE_DES_MODELES } from './modeles-batiments.js';

const ECART_MINIMAL_ENTRE_IMMEUBLES = 4;
const NOMBRE_DE_MODELES_MEMORISES = 2;

export const creerSelecteurDeBatiments = (aleatoire) => {
  let modelesRecents = [];
  let batimentsDepuisLeDernierImmeuble = ECART_MINIMAL_ENTRE_IMMEUBLES;

  const estAutorise = (modele) => {
    if (modelesRecents.includes(modele.nom)) return false;
    if (modele.categorie === 'immeuble') {
      return batimentsDepuisLeDernierImmeuble >= ECART_MINIMAL_ENTRE_IMMEUBLES;
    }
    return true;
  };

  const tirerAuSort = (candidats) => {
    const total = candidats.reduce((somme, modele) => somme + modele.poids, 0);
    let tirage = aleatoire() * total;
    for (const modele of candidats) {
      tirage -= modele.poids;
      if (tirage <= 0) return modele;
    }
    return candidats[candidats.length - 1];
  };

  return () => {
    const candidats = CATALOGUE_DES_MODELES.filter(estAutorise);
    const modele = tirerAuSort(candidats.length > 0 ? candidats : CATALOGUE_DES_MODELES);
    modelesRecents = [modele.nom, ...modelesRecents].slice(0, NOMBRE_DE_MODELES_MEMORISES);
    batimentsDepuisLeDernierImmeuble =
      modele.categorie === 'immeuble' ? 0 : batimentsDepuisLeDernierImmeuble + 1;
    return { nomDuModele: modele.nom, categorie: modele.categorie, ...modele.creer(aleatoire) };
  };
};
