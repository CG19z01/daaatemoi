// Preparation d'une ville : localisation puis generation de son fond de carte,
// dans le meme repere et le meme format que le fichier fige de Rouen.
// Le resultat est mis en cache : une ville n'est extraite qu'une seule fois.
import { entrepot } from './entrepot.js';
import { geocoderUneVille } from './geocodage.js';
import { interrogerOverpass } from './overpass.js';
import { composerLaRequeteDeVille } from './requete-de-ville.js';
import { construireLeFondDeVille } from './fond-de-ville.js';
import { enCle } from '../utilitaires/cle.js';

const cleDeLaRecherche = (cle) => `ville-${cle}`;
const cleDuFond = (cle) => `carte-ville-${cle}`;

export const recupererLeFondDeVille = (cleDeLaVille) =>
  entrepot.lireDocument(cleDuFond(enCle(cleDeLaVille)));

export const recupererUneVille = (cleDeLaVille) =>
  entrepot.lireDocument(cleDeLaRecherche(enCle(cleDeLaVille)));

const genererLeFond = async (ville) => {
  const dejaGenere = await entrepot.lireDocument(cleDuFond(ville.cle));
  if (dejaGenere) return dejaGenere;
  const elements = await interrogerOverpass(composerLaRequeteDeVille(ville));
  const fond = construireLeFondDeVille(elements, ville);
  await entrepot.ecrireDocument(cleDuFond(ville.cle), fond);
  return fond;
};

// Renvoie { ville } ou { erreur }. La ville porte la cle de son fond de carte.
export const preparerLaVille = async (nomDemande) => {
  const nomTape = String(nomDemande ?? '').trim();
  if (!nomTape) return { erreur: 'Veuillez indiquer une ville.' };

  // Une ville tapee dans une autre ecriture ne donne pas de cle : la recherche
  // reste possible, seul le cache par nom tape est alors saute.
  const cleTapee = enCle(nomTape);
  const dejaConnue = cleTapee ? await entrepot.lireDocument(cleDeLaRecherche(cleTapee)) : null;
  if (dejaConnue) return { ville: dejaConnue };

  const trouvee = await geocoderUneVille(nomDemande);
  if (!trouvee) return { erreur: 'Cette ville est introuvable.' };

  const cleResolue = enCle(trouvee.nom) || cleTapee;
  if (!cleResolue) return { erreur: 'Cette ville est introuvable.' };
  const ville = {
    cle: cleResolue,
    nom: trouvee.nom,
    pays: trouvee.pays,
    latitude: trouvee.latitude,
    longitude: trouvee.longitude,
  };
  await genererLeFond(ville);
  // Enregistree sous le nom tape : la meme recherche reutilise le meme fond.
  if (cleTapee) await entrepot.ecrireDocument(cleDeLaRecherche(cleTapee), ville);
  await entrepot.ecrireDocument(cleDeLaRecherche(ville.cle), ville);
  return { ville };
};
