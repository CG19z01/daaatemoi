# Viens on se date !

Plateforme de propositions de rendez-vous illustrées. N'importe qui compose son
propre date sur `/create` — une ville, jusqu'à 5 lieux placés à la main, ses
disponibilités — puis partage un lien protégé par mot de passe à la personne
qu'il invite. Les cartes sont dessinées au trait, en noir et blanc, dans un style
cartoon en fausse 3D.

La carte de Rouen d'origine (`/carte`) a été retirée ; son moteur de rendu sert
désormais à toutes les villes, et l'administration conserve les rendez-vous et le
journal d'alors.

**En ligne : https://daaatemoi.vercel.app**

## Stack

- **Node.js 20+ / Express** (unique dépendance de production)
- **HTML, CSS et JavaScript modules** côté navigateur, sans framework ni étape de build
- **Canvas 2D** pour la carte (projection latitude/longitude vers une vue inclinée) : le fond vient d'un extrait **OpenStreetMap** converti en mètres par le serveur, aucune tuile, aucun appel réseau depuis le navigateur
- **Stockage JSON** dans `donnees/` en local, **Upstash Redis** en ligne
- **OpenStreetMap** pour les villes et les lieux : Nominatim pour localiser une ville,
  Overpass pour extraire son fond de carte et rechercher des établissements réels.
  Ni compte, ni clé API, donc aucun secret à protéger côté navigateur.

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs
npm start              # http://localhost:3000
npm run dev            # rechargement automatique
npm run verifier       # syntaxe, limite de 150 lignes, identifiants des pages
npm test               # les vérifications ci-dessus + les tests de bout en bout
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
| `SITE_ADRESSE_PUBLIQUE` | adresse du site pour composer le lien partagé (facultatif : Vercel fournit `VERCEL_PROJECT_PRODUCTION_URL`, sinon l'hôte de la requête est utilisé) | `https://daaatemoi.vercel.app` |
| `OSM_AGENT` | identification de l'appelant auprès d'OpenStreetMap (recommandé) | `daaatemoi/1.0 (contact@exemple.fr)` |
| `NOMINATIM_ADRESSE` | instance de géocodage (facultatif) | `https://nominatim.openstreetmap.org` |
| `OVERPASS_ADRESSES` | instances Overpass, séparées par des virgules (facultatif) | valeurs par défaut |

Aucune de ces variables n'est un secret : les services OpenStreetMap utilisés sont
ouverts et ne demandent pas de clé. Les seuls secrets restent `SECRET_SIGNATURE`,
les identifiants d'administration, les jetons Upstash et le sujet ntfy.

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
- `/create` : création d'une expérience personnalisée
- `/trois-mots-romantiques-for-you` : page invitée. La carte de la ville s'affiche
  aussitôt, et la demande de mot de passe se pose par-dessus : le contenu de
  l'expérience n'est chargé qu'après validation, vérifiée côté serveur.
- `/admin` : administration (non listée dans la navigation, authentification serveur)

## Créer une expérience

1. **La ville.** Nominatim la localise, Overpass extrait son fond de carte
   (fleuve, voies, parcs), simplifié et converti en mètres relatifs au centre :
   exactement le format du fichier figé de Rouen. Le rayon d'extraction suit la
   taille réelle de la ville, et le cadrage se règle sur sa zone bâtie — un village
   et une métropole ne reçoivent donc pas le même zoom. Le résultat est mis en
   cache, une ville n'est extraite qu'une fois.
2. **Les lieux.** Jusqu'à 5, cherchés parmi les lieux réels d'OpenStreetMap :
   établissements, mais aussi cathédrales, musées, monuments, parcs et points de
   vue. La recherche comprend le français (« cathédrale », « musée ») et tolère les
   accents. Chaque lieu porte la couleur de son point. Tout reste modifiable, et un
   lieu absent des données peut être ajouté à la main.
3. **Les points.** Aucun n'est placé automatiquement : chaque lieu est posé d'un appui
   sur la carte, puis déplaçable ou supprimable. La position est retenue en mètres,
   elle suit donc la carte sur n'importe quel écran.
4. **Les disponibilités.** Plusieurs dates, avec un début et une fin. Les heures
   proposées commencent au plus tôt 2 h avant l'ouverture du lieu et au plus tard
   1 h avant sa fermeture, plages multiples et fermeture après minuit comprises.
   Les minutes vont toujours de 5 en 5.
5. **Le partage.** Un mot de passe (haché avec scrypt, jamais stocké en clair) puis
   un lien à trois mots romantiques, par exemple `/amour-luna-cuore-for-you`.
   Les mots viennent de `serveur/donnees/mots-romantiques.txt` : 2 341 mots dans
   112 langues, soit près de 12,8 milliards d'adresses possibles. Le fichier se
   complète à la main, un mot par ligne.

Sur la carte, quatre outils : **Feutre** (trait au geste maintenu), **Coloriage**
(un appui remplit la zone visée en suivant les contours), **Texte** (zones de texte
déplaçables) et **Gomme** (n'efface que ce qui a été ajouté, jamais le fond).

L'invité saisit le mot de passe, dessine sur la carte, retient une des dates
proposées, en propose jusqu'à 3 autres, et peut ajouter des lieux dans la limite
globale de 5. Tout est revalidé côté serveur.

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
serveur/donnees/    liste des lieux de Rouen, banque de mots des adresses
serveur/services/   entrepôt, expériences, cartographie OpenStreetMap
serveur/utilitaires/ validations, horaires, créneaux, mots de passe, géométrie
public/             pages, styles et scripts du navigateur
public/scripts/carte/  moteur de la carte : projection, fond, décor, rendu, mer, coloriage
public/scripts/commun/ carte réutilisable, placement, horaires, créneaux, fenêtres partagées
public/scripts/creation/ page /create
public/scripts/invite/   page invitée
public/fragments/   fenêtres partagées par les deux nouvelles pages
donnees/            journal des clics et réservations (JSON, généré)
donnees/documents/  villes, fonds de carte et expériences (JSON, généré)
scripts-verification/  syntaxe, limite de 150 lignes, cohérence des pages, tests
```
