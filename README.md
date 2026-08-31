# Viens on se date !

Site interactif de proposition de rendez-vous à Rouen : une page d'accueil,
une carte cartoon en fausse 3D, un effet de coloration au doigt ou à la souris,
une réservation, un journal des clics et une page d'administration protégée.

## Stack

- **Node.js 20+ / Express** (unique dépendance de production)
- **HTML, CSS et JavaScript modules** côté navigateur, sans framework ni étape de build
- **Canvas 2D** pour la carte (projection latitude/longitude vers une vue inclinée), dessinée à partir d'un extrait **OpenStreetMap** figé dans `public/donnees/carte-rouen.json` : aucune tuile ni appel réseau externe à l'exécution
- **Stockage JSON** dans `donnees/` : ni base de données, ni service tiers

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs
npm start              # http://localhost:3000
npm run dev            # rechargement automatique
npm run verifier       # syntaxe + limite de 150 lignes par fichier
```

## Variables d'environnement

| Variable | Rôle | Exemple (factice) |
| --- | --- | --- |
| `PORT` | port d'écoute | `3000` |
| `SECRET_SIGNATURE` | signature HMAC des cookies | `remplacer_par_32_octets_aleatoires` |
| `ADMIN_IDENTIFIANT` | identifiant administrateur | `admin` |
| `ADMIN_MOT_DE_PASSE` | mot de passe administrateur | `remplacer_par_un_mot_de_passe` |
| `UPSTASH_REDIS_REST_URL` | stockage partagé (déploiement) | injecté par l'intégration |
| `UPSTASH_REDIS_REST_TOKEN` | stockage partagé (déploiement) | injecté par l'intégration |
| `NTFY_SUJET` | sujet ntfy notifié à chaque rendez-vous (facultatif) | `sujet-long-et-impossible-a-deviner` |
| `NTFY_ADRESSE` | instance ntfy (facultatif) | `https://ntfy.sh` |
| `NTFY_JETON` | authentification ntfy, si l'instance l'exige (facultatif) | vide |

Secret aléatoire : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Déploiement sur Vercel

Le disque de Vercel est en lecture seule et les instances sont multiples : le journal
et les réservations passent donc par **Upstash Redis**
(intégration du Marketplace Vercel). Sans variables Upstash, le projet retombe
automatiquement sur les fichiers JSON de `donnees/` — pratique en local, inutilisable en ligne.

```bash
vercel link
vercel integration add upstash/upstash-kv --plan free -m primaryRegion=fra1
vercel deploy --prod
```

- `api/index.js` expose l'application Express ; `vercel.json` route tout vers elle
  et empêche `public/` d'être servi en statique, pour que toutes les pages passent
  par les routes du serveur.
- `serveur/application.js` assemble l'application, `serveur/index.js` ne sert qu'au
  démarrage local.

## Pages

- `/` : « Viens on se date ! »
- `/carte` : carte interactive de Rouen
- `/admin` : administration (non listée dans la navigation, authentification serveur)

## Modifier les lieux

Tout se passe dans `serveur/donnees/lieux.js` : ajouter un objet à `listeDesLieux`
avec `identifiant`, `nom`, `latitude`, `longitude`, `activite`, `joursDOuverture`,
`horaireOuverture` et `horaireFermeture`. La liste n'est jamais modifiable depuis le navigateur.

## Fond de carte

Le tracé de la Seine, le réseau de voies et les parcs proviennent d'**OpenStreetMap**
(© les contributeurs OpenStreetMap, licence ODbL), extraits le 25/08/2026 via l'API Overpass,
simplifiés à 12 m et convertis en mètres relatifs au centre du projet.
Toute diffusion publique du site doit conserver cette attribution.

## Organisation

```
serveur/            configuration, routes, services, middlewares, utilitaires
serveur/donnees/    liste des lieux (source unique)
public/             pages, styles et scripts du navigateur
public/scripts/carte/  projection, fond de carte, décor, rendu, marqueurs, coloration, réservation
public/donnees/     fond de carte réel (Seine, voies, parcs) extrait d'OpenStreetMap
donnees/            journal des clics et réservations (JSON, généré)
scripts-verification/  contrôle de la limite de 150 lignes
```
