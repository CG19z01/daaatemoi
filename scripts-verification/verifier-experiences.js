// Test de bout en bout de la plateforme d experiences : creation, lien partage,
// acces invite, reponse et administration. Aucun service exterieur n est
// appele : la ville du jeu d essai est ecrite directement dans l entrepot.
import { rm, readdir } from 'node:fs/promises';
import { join } from 'node:path';

process.env.SECRET_SIGNATURE ??= 'secret-de-test-uniquement-pour-les-verifications';
process.env.ADMIN_IDENTIFIANT ??= 'admin-de-test';
process.env.ADMIN_MOT_DE_PASSE ??= 'mot-de-passe-admin-de-test';
// Ni stockage partage ni notification pendant les tests.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.NTFY_SUJET;

const { application } = await import('../serveur/application.js');
const { entrepot } = await import('../serveur/services/entrepot.js');
const { creerClient, verifier, titre, bilan } = await import('./outils-de-test.js');
const { semerLaVille, VILLE_DE_TEST } = await import('./donnees-de-test.js');
const scenarioCreation = await import('./scenario-creation.js');
const scenarioInvite = await import('./scenario-invite.js');
const scenarioCarte = await import('./scenario-carte.js');
const scenarioAcces = await import('./scenario-acces.js');
const scenarioRegles = await import('./scenario-regles.js');
const scenarioMots = await import('./scenario-mots.js');
const scenarioFond = await import('./scenario-fond.js');
const scenarioDecor = await import('./scenario-decor.js');

const dossierDesDocuments = join(process.cwd(), 'donnees', 'documents');

// Les documents crees par le test sont retires : le dossier de donnees du
// projet retrouve exactement son etat d avant.
const nettoyer = async (documentsAvant) => {
  const documentsApres = await readdir(dossierDesDocuments).catch(() => []);
  for (const nom of documentsApres) {
    if (!documentsAvant.includes(nom)) await rm(join(dossierDesDocuments, nom), { force: true });
  }
};

const verifierLAdministration = async (slug) => {
  titre('Administration');
  const admin = creerClient(adresseDeBase);
  const avant = await admin.appeler('/admin/api/experiences');
  verifier(avant.statut === 401, 'les experiences sont protegees par l authentification');

  await admin.envoyer('/admin/api/connexion', {
    identifiant: process.env.ADMIN_IDENTIFIANT,
    motDePasse: process.env.ADMIN_MOT_DE_PASSE,
  });
  const apres = await admin.appeler('/admin/api/experiences');
  const trouvee = apres.donnees.experiences?.find((experience) => experience.slug === slug);
  verifier(apres.statut === 200 && Boolean(trouvee), 'l administration liste la nouvelle experience');
  verifier(trouvee?.ville === VILLE_DE_TEST.nom, 'la ville apparait dans l administration');
  verifier(trouvee?.nombreDeLieux === 5, 'le nombre de lieux apparait dans l administration');
  verifier(trouvee?.propositions.length === 3, 'les propositions de l invite apparaissent');
  verifier(!apres.texte.includes('scrypt'), 'aucune empreinte de mot de passe n apparait dans l administration');

  verifier((await admin.appeler('/admin/api/journal')).statut === 200, 'le journal existant fonctionne toujours');
  verifier((await admin.appeler('/admin/api/reservations')).statut === 200, 'les rendez-vous existants restent disponibles');
  verifier((await admin.appeler('/api/lieux')).statut === 200, 'la carte historique de Rouen repond toujours');
};

const documentsAvant = await readdir(dossierDesDocuments).catch(() => []);
const serveur = application.listen(0);
const adresseDeBase = `http://127.0.0.1:${serveur.address().port}`;

try {
  await semerLaVille(entrepot);
  const nouveauClient = () => creerClient(adresseDeBase);
  const { slug, motDePasse } = await scenarioCreation.verifierLaCreation(nouveauClient);
  await scenarioCreation.verifierLesReglesHoraires(nouveauClient);
  await scenarioCreation.verifierLaLimitationDesCreations(nouveauClient);

  await scenarioAcces.verifierLAncienneCarte(nouveauClient());
  await scenarioAcces.verifierLApercuPublic(nouveauClient(), slug);

  const invite = creerClient(adresseDeBase);
  const experience = await scenarioInvite.verifierLAccesInvite(invite, { slug, motDePasse });
  await scenarioInvite.verifierLaReponse(invite, slug, experience);
  await scenarioInvite.verifierLesLieuxDeLInvite(invite, slug);
  await scenarioInvite.verifierLeDessin(invite, slug);
  await scenarioCarte.verifierLaCouleurDesPoints(invite, slug, experience);
  await scenarioCarte.verifierLesTextes(invite, slug);
  await scenarioCarte.verifierLeRemplissage(invite, slug);
  await verifierLAdministration(slug);
  await scenarioRegles.verifierLUniciteDesAdresses();
  scenarioMots.verifierLaBanqueDeMots();
  scenarioRegles.verifierLeCadrageDesVilles();
  scenarioRegles.verifierLesCategoriesDeLieux();
  scenarioRegles.verifierLeRemplissageDeZone();
  scenarioFond.verifierLeTriDuFond();
  scenarioFond.verifierLeCoteDeLEau();
  scenarioDecor.verifierLeDecor();
  scenarioDecor.verifierUnLittoralMorcele();
  scenarioDecor.verifierLaSecuriteDesVoies();
} finally {
  serveur.close();
  await nettoyer(documentsAvant);
}

process.exit(bilan() ? 0 : 1);
