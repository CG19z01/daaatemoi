// Vérifications des outils de carte : couleur des points, zones de texte et
// remplissage, tous protégés par l'accès à l'expérience.
import { verifier, titre } from './outils-de-test.js';

const texte = (contenu, x, y) => ({
  contenu,
  point: { x, y },
  couleur: '#1155cc',
  taille: 24,
});

export const verifierLaCouleurDesPoints = async (client, slug, experience) => {
  titre('Couleur des points');
  const premier = experience.lieux[0];
  verifier(/^#[0-9a-f]{6}$/i.test(premier.couleur), 'chaque lieu porte une couleur de point');

  const modifier = (identifiant, corps) =>
    client.appeler(`/api/experiences/${slug}/lieux/${identifiant}`, {
      method: 'PATCH',
      body: JSON.stringify(corps),
    });

  const change = await modifier(premier.identifiant, { couleur: '#00aa55' });
  verifier(change.statut === 200, 'la couleur d’un point peut être modifiée');
  verifier(
    change.donnees.lieux[0].couleur === '#00aa55',
    'la couleur modifiée est bien celle enregistrée',
  );
  verifier(
    change.donnees.lieux[0].horaires !== undefined,
    'changer la couleur ne touche pas aux horaires du lieu',
  );

  const relue = await client.appeler(`/api/experiences/${slug}`);
  verifier(
    relue.donnees.experience.lieux[0].couleur === '#00aa55',
    'la couleur est restaurée au rechargement',
  );
  verifier(
    (await modifier(premier.identifiant, { couleur: 'rouge vif' })).statut === 400,
    'une couleur invalide est refusée',
  );
};

export const verifierLesTextes = async (client, slug) => {
  titre('Zones de texte');
  const chemin = `/api/experiences/${slug}/textes`;
  const enregistrer = (textes) =>
    client.appeler(chemin, { method: 'PUT', body: JSON.stringify({ textes }) });

  const vide = await client.appeler(chemin);
  verifier(vide.statut === 200 && vide.donnees.textes.length === 0, 'une carte neuve n’a aucun texte');

  const ajout = await enregistrer([texte('Rendez-vous ici', 120, -80)]);
  verifier(ajout.statut === 200 && ajout.donnees.textes.length === 1, 'une zone de texte est ajoutée');
  verifier(ajout.donnees.textes[0].point.x === 120, 'la position est retenue en mètres, pas en pixels');

  const modifie = await enregistrer([texte('Plutôt là', 300, 200)]);
  verifier(
    modifie.donnees.textes[0].contenu === 'Plutôt là' && modifie.donnees.textes[0].point.x === 300,
    'un texte peut être modifié et déplacé',
  );

  const relus = await client.appeler(chemin);
  verifier(relus.donnees.textes.length === 1, 'les textes sont restaurés au rechargement');

  verifier((await enregistrer([])).donnees.textes.length === 0, 'un texte peut être supprimé');
  verifier((await enregistrer([texte('', 0, 0)])).statut === 400, 'un texte vide est refusé');
  verifier(
    (await enregistrer([texte('Trop loin', 50000, 0)])).statut === 400,
    'un texte placé hors de la carte est refusé',
  );
  verifier(
    (await enregistrer(Array.from({ length: 25 }, (rien, rang) => texte(`n${rang}`, rang, 0)))).statut === 400,
    'le nombre de textes est borné',
  );

  const borne = await enregistrer([{ ...texte('Taille folle', 0, 0), taille: 900, couleur: 'bleu' }]);
  verifier(borne.donnees.textes[0].taille <= 64, 'une taille démesurée est ramenée dans les bornes');
  verifier(borne.donnees.textes[0].couleur === '#000000', 'une couleur invalide retombe sur le noir');
  await enregistrer([]);
};

export const verifierLeRemplissage = async (client, slug) => {
  titre('Outil Coloriage');
  const chemin = `/api/experiences/${slug}/dessin`;
  const envoyer = (trait) => client.envoyer(chemin, trait);

  const rempli = await envoyer({ mode: 'remplissage', couleur: '#ffcc00', points: [[40, -60]] });
  verifier(rempli.statut === 201, 'un remplissage est enregistré');

  const traits = (await client.appeler(chemin)).donnees.traits;
  const dernier = traits.at(-1);
  verifier(dernier.mode === 'remplissage', 'le remplissage est relu comme tel');
  verifier(
    dernier.points.length === 1,
    'seul le point visé est stocké : la zone se recalcule à l’affichage',
  );
  verifier(
    traits.some((trait) => trait.mode === 'feutre'),
    'le feutre continue de tracer des traits, à part',
  );
  verifier(
    (await envoyer({ mode: 'remplissage', couleur: '#ffcc00', points: [[0, 0], [1, 1]] })).statut === 400,
    'un remplissage à plusieurs points est refusé',
  );
  verifier(
    (await envoyer({ mode: 'remplissage', couleur: 'jaune', points: [[0, 0]] })).statut === 400,
    'un remplissage sans couleur valable est refusé',
  );
};
