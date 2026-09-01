// Interrogation d'Overpass, l'API de requetes d'OpenStreetMap : gratuite, sans
// compte ni cle API. Les instances publiques sont parfois saturees, on essaie
// donc les adresses configurees les unes apres les autres.
import { configuration } from '../config.js';

const DELAI_MAXIMAL_EN_MILLISECONDES = 55000;
// Les instances publiques refusent parfois une requete par simple surcharge :
// un second passage, apres une courte pause, suffit le plus souvent.
const PASSAGES = 2;
const PAUSE_ENTRE_PASSAGES = 1500;

const attendre = (duree) => new Promise((terminer) => setTimeout(terminer, duree));

const interroger = async (serveur, requete) => {
  const reponse = await fetch(serveur, {
    method: 'POST',
    headers: {
      'User-Agent': configuration.agentOsm,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ data: requete }).toString(),
    signal: AbortSignal.timeout(DELAI_MAXIMAL_EN_MILLISECONDES),
  });
  if (!reponse.ok) throw new Error(`statut ${reponse.status}`);
  // Une instance saturee repond une page HTML avec un statut 200 : on le detecte.
  const type = reponse.headers.get('content-type') ?? '';
  if (!type.includes('json')) throw new Error('reponse inattendue');
  return reponse.json();
};

// Renvoie la liste des elements OpenStreetMap, ou leve si aucune instance
// n'a pu repondre. Seul le type d'erreur est journalise.
export const interrogerOverpass = async (requete) => {
  let dernierProbleme = 'aucun serveur configure';
  for (let passage = 1; passage <= PASSAGES; passage += 1) {
    for (const serveur of configuration.serveursOverpass) {
      try {
        const donnees = await interroger(serveur, requete);
        return Array.isArray(donnees?.elements) ? donnees.elements : [];
      } catch (erreur) {
        dernierProbleme = erreur.name === 'Error' ? erreur.message : erreur.name;
        console.error(`Overpass indisponible (${new URL(serveur).host}) : ${dernierProbleme}`);
      }
    }
    if (passage < PASSAGES) await attendre(PAUSE_ENTRE_PASSAGES);
  }
  throw new Error(`Overpass indisponible : ${dernierProbleme}`);
};

// Boite englobante Overpass "sud,ouest,nord,est" autour d'un centre.
export const boiteAutourDuCentre = (centre, rayonEnMetres) => {
  const ecartLatitude = rayonEnMetres / 110574;
  const ecartLongitude =
    rayonEnMetres / (111320 * Math.cos((centre.latitude * Math.PI) / 180) || 1);
  return [
    (centre.latitude - ecartLatitude).toFixed(6),
    (centre.longitude - ecartLongitude).toFixed(6),
    (centre.latitude + ecartLatitude).toFixed(6),
    (centre.longitude + ecartLongitude).toFixed(6),
  ].join(',');
};
