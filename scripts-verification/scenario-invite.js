// Verifications de la page invitee : mot de passe, acces, choix d une date,
// propositions alternatives, ajout de lieux et coloriage.
import { verifier, titre } from './outils-de-test.js';
import { demain, lieuxDeTest } from './donnees-de-test.js';

export const verifierLAccesInvite = async (client, { slug, motDePasse }) => {
  titre('Acces de l invite');

  const page = await client.appeler(`/${slug}-for-you`);
  verifier(page.statut === 200 && page.texte.includes('<!doctype html>'), 'la page invitee est servie');
  verifier((await client.appeler('/deux-mots-for-you')).statut === 404, 'une adresse mal formee mene au 404');
  // Une adresse bien formee mais inconnue affiche quand meme l'ecran de mot de
  // passe : rien ne permet de deviner quelles adresses existent vraiment.
  verifier(
    (await client.appeler('/aucun-lien-ici-for-you')).statut === 200,
    'une adresse inexistante mais bien formee affiche le meme ecran',
  );

  const avantConnexion = await client.appeler(`/api/experiences/${slug}`);
  verifier(avantConnexion.statut === 401, 'les donnees sont refusees sans mot de passe');

  const mauvais = await client.envoyer(`/api/experiences/${slug}/connexion`, { motDePasse: 'faux' });
  const inconnu = await client.envoyer('/api/experiences/aucun-lien-ici/connexion', { motDePasse: 'faux' });
  verifier(mauvais.statut === 401, 'un mauvais mot de passe est refuse');
  verifier(
    inconnu.statut === 401 && inconnu.donnees.erreur === mauvais.donnees.erreur,
    'un lien inexistant et un mauvais mot de passe donnent le meme message',
  );

  const bon = await client.envoyer(`/api/experiences/${slug}/connexion`, { motDePasse });
  verifier(bon.statut === 200, 'le bon mot de passe ouvre l acces');

  const donnees = await client.appeler(`/api/experiences/${slug}`);
  verifier(donnees.statut === 200, 'les donnees sont accessibles apres connexion');
  verifier(
    !donnees.texte.includes('empreinte') && !donnees.texte.includes('scrypt'),
    'aucune empreinte de mot de passe n est envoyee au navigateur',
  );
  return donnees.donnees.experience;
};

export const verifierLaReponse = async (client, slug, experience) => {
  titre('Reponse de l invite');
  const creneau = (heureDeDebut) => ({
    date: demain(),
    heureDeDebut,
    heureDeFin: '21:30',
    identifiantDuLieu: experience.lieux[2]?.identifiant ?? null,
  });
  const envoyer = (corps) => client.envoyer(`/api/experiences/${slug}/reponse`, corps);

  verifier((await envoyer({ rangDeLaDisponibilite: 99 })).statut === 400, 'une disponibilite inexistante est refusee');
  verifier((await envoyer({})).statut === 400, 'une reponse vide est refusee');
  verifier(
    (await envoyer({ propositions: [creneau('18:00'), creneau('19:00'), creneau('20:00'), creneau('20:30')] })).statut === 400,
    'une quatrieme proposition est refusee',
  );
  verifier(
    (await envoyer({ propositions: [creneau('18:00'), creneau('18:00')] })).statut === 400,
    'deux propositions identiques sont refusees',
  );

  const valide = await envoyer({
    rangDeLaDisponibilite: 0,
    propositions: [creneau('18:00'), creneau('19:00'), creneau('20:00')],
  });
  verifier(valide.statut === 201, 'une reponse complete est acceptee');
  verifier(valide.donnees.reponse?.propositions.length === 3, 'les trois propositions sont enregistrees');
  verifier(valide.donnees.reponse?.rendezVousChoisi?.heureDeDebut === '08:00', 'la disponibilite choisie est enregistree');

  const relue = await client.appeler(`/api/experiences/${slug}`);
  verifier(relue.donnees.experience?.reponse?.propositions.length === 3, 'la reponse est bien persistee');
};

export const verifierLesLieuxDeLInvite = async (client, slug) => {
  titre('Lieux ajoutes par l invite');
  const ajouter = (lieux) => client.envoyer(`/api/experiences/${slug}/lieux`, { lieux });

  const quatrieme = await ajouter([{ ...lieuxDeTest()[0], nom: 'Ajout invite', point: { x: 10, y: 10 } }]);
  verifier(quatrieme.statut === 201 && quatrieme.donnees.lieux.length === 4, 'l invite peut ajouter un quatrieme lieu');
  verifier(
    quatrieme.donnees.lieux.at(-1).ajoutePar === 'invite',
    'le lieu ajoute est distingue de ceux du createur',
  );

  titre('Correction des horaires par l invite');
  const premier = quatrieme.donnees.lieux[0];
  const corriges = await client.appeler(
    `/api/experiences/${slug}/lieux/${premier.identifiant}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ horaires: { lundi: [{ ouverture: '09:00', fermeture: '17:00' }] } }),
    },
  );
  verifier(corriges.statut === 200, 'l invite peut corriger les horaires d un lieu');
  verifier(
    corriges.donnees.lieux[0].horaires?.lundi?.[0].ouverture === '09:00',
    'les horaires corriges sont enregistres',
  );
  verifier(
    (await client.appeler(`/api/experiences/${slug}/lieux/lieu-inconnu`, {
      method: 'PATCH',
      body: JSON.stringify({ horaires: null }),
    })).statut === 404,
    'un lieu inconnu ne peut pas etre modifie',
  );

  const cinquieme = await ajouter([{ ...lieuxDeTest()[1], nom: 'Cinquieme', point: { x: 20, y: 20 } }]);
  verifier(cinquieme.statut === 201, 'le cinquieme lieu passe encore');
  const sixieme = await ajouter([{ ...lieuxDeTest()[2], nom: 'Sixieme', point: { x: 30, y: 30 } }]);
  verifier(sixieme.statut === 400, 'le sixieme lieu est refuse, createur et invite confondus');
};

export const verifierLeDessin = async (client, slug) => {
  titre('Coloriage de l experience');
  const trait = { mode: 'feutre', couleur: '#a30dad', tailleEnMetres: 12, points: [[0, 0], [10, 10]] };
  verifier((await client.envoyer(`/api/experiences/${slug}/dessin`, trait)).statut === 201, 'un trait est enregistre');
  const dessin = await client.appeler(`/api/experiences/${slug}/dessin`);
  verifier(dessin.donnees.traits?.length === 1, 'le trait est relu depuis le serveur');
  verifier(
    (await client.envoyer(`/api/experiences/${slug}/dessin`, { mode: 'crayon' })).statut === 400,
    'un trait invalide est refuse',
  );
};
