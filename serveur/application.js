// Assemblage de l'application : middlewares, routes et gestion des erreurs.
// Aucune ecoute ici, pour que le meme code serve en local et sur Vercel.
import express from 'express';
import { join } from 'node:path';
import { verifierConfiguration } from './config.js';
import { dossierPublic } from './chemins.js';
import { routesPages } from './routes/pages.js';
import { routesApi } from './routes/api.js';
import { routesAdmin } from './routes/admin.js';
import { routesCartes } from './routes/cartes.js';
import { routesCreation } from './routes/creation.js';
import { routesExperiences } from './routes/experiences.js';
import { routesDessinDExperience } from './routes/experience-dessin.js';
import { routesTextesDExperience } from './routes/experience-textes.js';
import { routesApercuDExperience } from './routes/experience-apercu.js';
import { identifierLeVisiteur } from './middlewares/session-visiteur.js';

verifierConfiguration();

const application = express();
application.disable('x-powered-by');
application.set('trust proxy', 1);

// En-tetes de securite minimalistes, sans dependance supplementaire.
application.use((requete, reponse, suite) => {
  reponse.setHeader('X-Content-Type-Options', 'nosniff');
  reponse.setHeader('Referrer-Policy', 'same-origin');
  reponse.setHeader('X-Frame-Options', 'DENY');
  reponse.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'self'",
  );
  suite();
});

// 32 ko : de quoi accueillir une experience complete (5 lieux et leurs
// horaires) ou un long trait de coloriage, sans ouvrir la porte a plus.
application.use(express.json({ limit: '32kb' }));
application.use('/styles', express.static(join(dossierPublic, 'styles')));
application.use('/scripts', express.static(join(dossierPublic, 'scripts')));
application.use('/donnees', express.static(join(dossierPublic, 'donnees')));
application.use('/fragments', express.static(join(dossierPublic, 'fragments')));

application.use('/admin', routesAdmin);
// Montees avant /api : chaque famille de routes garde son propre routeur.
application.use('/api/creation', routesCreation);
application.use('/api/experiences', routesDessinDExperience);
application.use('/api/experiences', routesTextesDExperience);
application.use('/api/experiences', routesApercuDExperience);
application.use('/api/experiences', routesExperiences);
application.use('/api', routesApi);
application.use('/cartes', identifierLeVisiteur, routesCartes);
application.use('/', routesPages);

// Chemin inconnu : un navigateur recoit une page lisible, un appel d'interface
// recoit du JSON. Aucune redirection, donc aucune boucle possible.
application.use((requete, reponse) => {
  if (!requete.path.startsWith('/api') && requete.accepts('html')) {
    return reponse.status(404).sendFile(join(dossierPublic, 'introuvable.html'));
  }
  return reponse.status(404).json({ erreur: 'Page introuvable.' });
});

application.use((erreur, requete, reponse, suite) => {
  if (erreur.type === 'entity.parse.failed' || erreur.type === 'entity.too.large') {
    return reponse.status(400).json({ erreur: 'Requête invalide.' });
  }
  console.error('Erreur serveur :', erreur.message);
  return reponse.status(500).json({ erreur: 'Erreur interne.' });
});

export { application };
