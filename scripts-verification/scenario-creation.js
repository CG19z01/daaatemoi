// Verifications de la creation d'une experience : ville, lieux, horaires,
// creneaux, mot de passe et adresse generee.
import { verifier, titre } from './outils-de-test.js';
import { experienceDeTest, lieuxDeTest, demain, VILLE_DE_TEST } from './donnees-de-test.js';
import { SLUG_VALIDE } from '../serveur/services/slug.js';

// Chaque creation part d un client neuf : le quota de creation est compte par
// visiteur, comme en vrai, et le test ne se bloque pas lui-meme.
const creer = (nouveauClient, options) =>
  nouveauClient().envoyer('/api/creation/experiences', experienceDeTest(options));

export const verifierLaCreation = async (nouveauClient) => {
  titre('Creation d une experience');

  const carte = await nouveauClient().appeler(`/api/creation/carte/${VILLE_DE_TEST.cle}`);
  verifier(carte.statut === 200 && Array.isArray(carte.donnees.fond?.riviere), 'la carte de la ville est servie');

  const creation = await creer(nouveauClient, {});
  verifier(creation.statut === 201, 'une experience complete est acceptee');
  const slug = creation.donnees.slug ?? '';
  verifier(SLUG_VALIDE.test(slug), `l adresse "${slug}" fait trois mots latins separes par des tirets`);
  verifier(slug.split('-').length === 3, 'l adresse contient exactement trois mots');
  verifier(
    /^[a-z_-]+$/.test(slug),
    'l adresse n utilise que des lettres latines, des tirets et des tirets bas',
  );
  verifier(
    typeof creation.donnees.lien === 'string' && creation.donnees.lien.endsWith(`${slug}-for-you`),
    'le lien partage se termine par -for-you',
  );

  const seconde = await creer(nouveauClient, {});
  verifier(seconde.statut === 201 && seconde.donnees.slug !== slug, 'deux creations donnent deux adresses differentes');

  titre('Limites et validations de la creation');
  const sixLieux = [...lieuxDeTest(), ...lieuxDeTest()].slice(0, 6);
  verifier((await creer(nouveauClient, { lieux: sixLieux })).statut === 400, 'un sixieme lieu est refuse');
  verifier((await creer(nouveauClient, { lieux: [] })).statut === 201, 'une experience sans lieu reste possible');
  verifier(
    (await creer(nouveauClient, { lieux: [{ ...lieuxDeTest()[0], point: null }] })).statut === 400,
    'un lieu sans point place sur la carte est refuse',
  );
  verifier(
    (await creer(nouveauClient, { lieux: [{ ...lieuxDeTest()[0], point: { x: 50000, y: 0 } }] })).statut === 400,
    'un point tres eloigne du centre est refuse',
  );
  verifier(
    (await creer(nouveauClient, { villeCle: 'ville-qui-n-existe-pas' })).statut === 400,
    'une ville inconnue est refusee',
  );

  titre('Mot de passe');
  verifier((await creer(nouveauClient, { motDePasse: 'court', confirmationDuMotDePasse: 'court' })).statut === 400, 'un mot de passe trop court est refuse');
  verifier((await creer(nouveauClient, { confirmationDuMotDePasse: 'autre-chose-encore' })).statut === 400, 'une confirmation differente est refusee');
  verifier((await creer(nouveauClient, { motDePasse: '', confirmationDuMotDePasse: '' })).statut === 400, 'le mot de passe est obligatoire');

  return { slug, motDePasse: experienceDeTest().motDePasse, lien: creation.donnees.lien };
};

export const verifierLesReglesHoraires = async (nouveauClient) => {
  titre('Regles horaires des disponibilites');
  const creneau = (modifications) => ({
    date: demain(),
    heureDeDebut: '08:00',
    heureDeFin: '09:00',
    indexDuLieu: 0,
    ...modifications,
  });
  const avec = (creneaux) => creer(nouveauClient, { disponibilites: creneaux });

  verifier((await avec([creneau({})])).statut === 201, '08:00 est accepte pour un lieu ouvrant a 10:00 (2 h avant)');
  verifier((await avec([creneau({ heureDeDebut: '07:55', heureDeFin: '09:00' })])).statut === 400, '07:55 est refuse : plus de 2 h avant l ouverture');
  verifier((await avec([creneau({ heureDeDebut: '20:00', heureDeFin: '21:00' })])).statut === 201, '21:00 est accepte pour une fermeture a 22:00 (1 h avant)');
  verifier((await avec([creneau({ heureDeDebut: '21:05', heureDeFin: '21:30' })])).statut === 400, '21:05 est refuse : moins d une heure avant la fermeture');
  verifier((await avec([creneau({ heureDeDebut: '08:07', heureDeFin: '09:00' })])).statut === 400, 'les minutes hors multiples de 5 sont refusees');
  verifier((await avec([creneau({ indexDuLieu: 1, heureDeDebut: '16:00', heureDeFin: '17:00' })])).statut === 201, 'la seconde plage d ouverture est prise en compte');
  verifier((await avec([creneau({ indexDuLieu: 1, heureDeDebut: '14:00', heureDeFin: '15:00' })])).statut === 400, 'le creux entre deux plages est refuse');
  verifier((await avec([creneau({ indexDuLieu: 2, heureDeDebut: '03:00', heureDeFin: '04:00' })])).statut === 201, 'un lieu sans horaires n impose aucune contrainte');
  verifier((await avec([creneau({ date: '2020-01-01' })])).statut === 400, 'une date passee est refusee');
};

// Le quota de creation protege le service d un usage automatise.
export const verifierLaLimitationDesCreations = async (nouveauClient) => {
  titre('Limitation des creations repetees');
  const client = nouveauClient();
  const statuts = [];
  for (let essai = 0; essai < 8; essai += 1) {
    statuts.push((await client.envoyer('/api/creation/experiences', experienceDeTest({}))).statut);
  }
  verifier(statuts.includes(429), 'les creations repetees finissent par etre refusees');
};
