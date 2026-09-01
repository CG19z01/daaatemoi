// Vérifications de l'accès à une expérience : ce qui est visible avant le mot
// de passe, et ce que devient l'ancienne page /carte.
import { verifier, titre } from './outils-de-test.js';

// L'aperçu public sert à dessiner la carte derrière la demande de mot de passe.
export const verifierLApercuPublic = async (client, slug) => {
  titre('Aperçu public, avant tout mot de passe');
  const apercu = await client.appeler(`/api/experiences/${slug}/ville`);
  verifier(apercu.statut === 200, 'la ville est accessible sans être connecté');
  verifier(Boolean(apercu.donnees.ville?.cle), 'elle porte de quoi dessiner la carte');
  verifier(
    !apercu.texte.includes('scrypt') && !apercu.texte.includes('empreinte'),
    'aucune empreinte de mot de passe n’y figure',
  );
  verifier(
    !apercu.texte.includes('lieux') && !apercu.texte.includes('disponibilites'),
    'ni les lieux ni les dates ne sortent avant la connexion',
  );
  verifier(
    (await client.appeler(`/api/experiences/${slug}`)).statut === 401,
    'le contenu de l’expérience reste protégé',
  );
  verifier(
    (await client.appeler('/api/experiences/aloha-cuore-sevgi/ville')).statut === 404,
    'un lien inconnu ne donne aucune ville',
  );
};

export const verifierLAncienneCarte = async (client) => {
  titre('Ancienne page /carte');
  const page = await client.appeler('/carte');
  verifier(page.statut === 404, '/carte ne donne plus accès à l’ancienne page');
  verifier(page.texte.includes('Rien par ici'), 'une page introuvable lisible est servie à la place');
  verifier(
    (await client.appeler('/api/lieux')).statut === 200,
    'les composants réutilisables restent en place côté serveur',
  );
};
