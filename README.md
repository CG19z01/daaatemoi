# Viens on se date !

Plateforme de propositions de rendez-vous illustrées. N'importe qui compose son
propre date sur `/create` — une ville, jusqu'à 5 lieux placés à la main, ses
disponibilités — puis partage un lien protégé par mot de passe à la personne
qu'il invite. Les cartes sont dessinées au trait, en noir et blanc, dans un style
cartoon en fausse 3D.

Le site ne connaît aucune ville par défaut : il charge celle qu'on lui demande.

**En ligne : https://daaatemoi.vercel.app**

## Stack

- **Node.js 20+ / Express** (unique dépendance de production)
- **HTML, CSS et JavaScript modules** côté navigateur, sans framework ni étape de build
- **Canvas 2D** pour la carte : le fond vient d'un extrait **OpenStreetMap** converti
  en mètres par le serveur — aucune tuile, aucun appel réseau depuis le navigateur
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
npm run verifier       # syntaxe, limite de 150 lignes, identifiants et chargement des pages
npm test               # les vérifications ci-dessus + les tests de bout en bout
```

---

# Comment ça marche, de A à Z

Cette partie suit le code dans l'ordre où il s'exécute : d'abord une requête qui
arrive, puis la création d'une expérience, puis le dessin de la carte, puis la
page invitée. Les chemins de fichiers sont donnés pour pouvoir lire à côté.

## 1. Le squelette : d'une requête à une réponse

Il n'existe qu'une seule application Express, assemblée dans
`serveur/application.js`, et **elle n'écoute jamais elle-même**. Deux points
d'entrée l'utilisent :

- `serveur/index.js` appelle `listen()` — c'est `npm start`, en local ;
- `api/index.js` l'exporte telle quelle — c'est la fonction servie par Vercel.

`vercel.json` route **tout** (`/(.*)`) vers cette fonction. `public/` n'est donc
jamais servi en statique par la plateforme : chaque page passe par une route du
serveur, ce qui permet d'y attacher cookies et en-têtes.

Une requête traverse les couches dans cet ordre :

1. **En-têtes de sécurité** — `nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`
   et une CSP `default-src 'self'` sans `unsafe-inline`. Conséquence pratique :
   aucun `onclick=` ni `<script>` en ligne n'est possible, tout le JavaScript vit
   dans des fichiers.
2. **`express.json({ limit: '32kb' })`** — de quoi accueillir une expérience
   complète ou un long trait de coloriage, pas davantage.
3. **Fichiers statiques** — `/styles`, `/scripts` et `/fragments` uniquement.
4. **Routes**, montées par famille : `/admin`, puis `/api/creation`,
   `/api/experiences`, puis les pages.
5. **404** — un navigateur reçoit `introuvable.html`, un appel d'interface reçoit
   du JSON. Aucune redirection, donc aucune boucle possible.
6. **Gestionnaire d'erreurs** — un JSON parasite ou trop gros devient un 400 ;
   tout le reste devient un 500 dont le détail reste dans les journaux.

Les pages elles-mêmes (`serveur/routes/pages.js`) sont au nombre de trois plus
une :

| Adresse | Fichier servi |
| --- | --- |
| `/` | `public/index.html` |
| `/create` | `public/creation.html` |
| `/trois-mots-for-you` | `public/invite.html` |
| `/admin` | `public/admin.html` (authentification serveur) |

La route invitée est un attrape-tout `/:adresse`, mais elle ne sert la page que
si `extraireLeSlug` reconnaît la forme attendue. Tout autre chemin continue sa
route vers le 404 : `/nimportequoi` ne devient jamais une page d'expérience.

## 2. Créer une expérience : le parcours côté serveur

### 2.1 La ville — `POST /api/creation/ville`

Tout part de `serveur/services/carte-de-ville.js`, et **presque tout est mis en
cache** : une ville n'est extraite qu'une seule fois.

1. **Cache par nom tapé.** « perpignan » a déjà été demandé ? Le document est
   rendu tel quel — à condition que sa `versionDuFond` corresponde à la version
   courante. Sinon on repart de zéro : c'est ce qui permet de faire évoluer le
   rendu sans vider le cache à la main.
2. **Géocodage** (`geocodage.js`) — Nominatim rend un nom, un pays, un couple
   latitude/longitude et une **boîte englobante**.
3. **Mesure** (`utilitaires/etendue-de-ville.js`) — la boîte englobante devient un
   rayon en mètres, borné entre 1 300 m et 3 600 m. Un village et une métropole
   ne reçoivent donc ni la même extraction ni le même cadrage.
4. **Extraction** (`overpass.js` + `requete-de-ville.js`) — une requête Overpass
   ramène cours d'eau, littoral, plans d'eau, voies et parcs. Plusieurs miroirs
   sont essayés à tour de rôle : ces serveurs publics sont souvent saturés.
5. **Conversion** (`fond-de-ville.js`) — c'est le cœur. Les coordonnées
   géographiques deviennent des **mètres relatifs au centre de la ville**, les
   tracés sont simplifiés (Douglas-Peucker, d'autant plus fort que la ville est
   grande), découpés à `rayon × 1,4` — cette limite, exposée sous le nom
   `portee`, dit jusqu'où vont les données — et classés en familles.
   `zone-batie.js` mesure au passage l'étendue réellement bâtie, par percentiles,
   pour ignorer les routes de campagne qui fausseraient le cadrage.

Le fond est enregistré sous `carte-ville-<cle>` et récupéré ensuite par
`GET /api/creation/carte/:cle`.

### 2.2 Les lieux — `GET /api/creation/lieux`

`recherche-de-lieux.js` interroge Overpass autour de la ville. Le classement est
fait maison : un lieu **du type cherché** pèse quatre fois plus qu'un simple
rapprochement de nom, sans quoi « Hôtel de la Cathédrale » passait devant la
cathédrale. Les horaires OpenStreetMap (`opening_hours`) sont traduits par
`utilitaires/horaires-osm.js` vers la forme interne, une entrée par jour :

```text
null                             -> horaires non renseignés
[]                               -> fermé ce jour-là
[{ ouverture, fermeture }, ...]  -> une ou plusieurs plages d'ouverture
```

Un lieu absent d'OpenStreetMap peut toujours être ajouté à la main.

### 2.3 La publication — `POST /api/creation/experiences`

Rien de ce qui vient du navigateur n'est repris tel quel. Les modules
`utilitaires/validation-*.js` revalident lieux, horaires, créneaux, textes et
traits ; les positions doivent tenir dans la zone de la ville ; le mot de passe
est haché avec **scrypt** (`utilitaires/mot-de-passe.js`) et son empreinte ne
quitte jamais le serveur — `sansSecret()` la retire de toute réponse.

## 3. Le tirage de l'adresse

`serveur/services/slug.js`. L'adresse est **toujours tirée par le serveur** ; le
navigateur n'en propose jamais une.

La banque vit dans `serveur/donnees/mots-romantiques.txt`, lue une fois au
démarrage : **1 798 mots utilisables répartis sur 134 langues**, dont 293 marqués
« reconnaissables ». Ajouter un mot, c'est ajouter une ligne. Une expression
tenant en plusieurs mots s'écrit avec des tirets bas (`mo_leannan`), qui ne se
confondent pas avec les tirets séparant les trois mots de l'adresse.

Chaque adresse contient **au moins un mot reconnaissable**, puis deux mots libres,
le tout mélangé (Fisher-Yates) pour que le mot repère ne soit pas toujours en
tête. Les répétitions sont permises. Cela donne
1798³ − 1505³ ≈ **2,4 milliards d'adresses**, par exemple `amour-luna-cuore-for-you`.

L'unicité n'est pas garantie par une vérification suivie d'une écriture — deux
créations simultanées pourraient s'y glisser — mais par une **écriture exclusive**
du stockage lui-même : `SET NX` sur Redis, ouverture en mode `wx` sur disque. Si
l'adresse est prise, on retire au sort, jusqu'à 20 fois.

## 4. Dessiner la carte, côté navigateur

### 4.1 Le montage

`public/scripts/commun/atelier-de-carte.js` assemble une carte complète : la
scène, les points des lieux, les zones de texte, la barre d'outils et les gestes.
**`/create` et la page invitée utilisent le même atelier**, avec le même balisage —
d'où le dossier `commun/`, à regarder avant d'écrire un nouveau module.

### 4.2 Le cadrage, en deux temps

`scene-de-carte.js`, à chaque redimensionnement :

1. `cadreDeLaZone` part de la zone bâtie et lui donne un peu d'air ;
2. `creerProjection` cadre en *fit to bounds* — le plus contraignant de la largeur
   et de la hauteur — avec une inclinaison qui **se redresse à mesure que l'écran
   s'allonge**, sans quoi une ville aplatie laisserait d'immenses bandes vides ;
3. `restreindreAuxDonnees` projette les quatre coins de l'écran vers les mètres et
   resserre la vue si l'un d'eux dépasse la `portee` du fond. Le centre ne bouge
   pas, seule l'étendue visible se réduit ;
4. si le cadre a changé, la projection est refaite.

C'est ce quatrième point qui garantit qu'**aucun rebord de carte n'est visible**.
`hors-carte.js` hachure ce qui dépasserait quand même : c'est un filet de
sécurité, plus une décoration attendue.

Toute position posée sur la carte — point d'un lieu, zone de texte, remplissage —
est retenue **en mètres relatifs au centre de la ville**, jamais en pixels. C'est
ce qui la rend juste sur n'importe quel écran, à n'importe quel zoom.

### 4.3 Le décor : bâtir toute la terre, et rien que la terre

`decor.js` remplit les espaces libres de maisons et d'immeubles. Les seuls
endroits laissés vides sont l'eau, les voies et les parcs. Trois mécanismes s'y
combinent :

- **une grille d'occupation** (`occupation.js`) marque ce qui est déjà pris ;
- **un test de la mer** (`cote.js`) situe un point par rapport au segment de
  littoral le plus proche, par produit vectoriel. Une approche par polygones
  décalés avait été essayée : sur Dieppe, deux décalages qui se recouvraient
  s'annulaient en remplissage *even-odd*, et la ville entière se bâtissait au large ;
- **une transformée de distance par chanfrein** (`proximite.js`) donne la distance
  à la voie la plus proche en deux passes. On ne bâtit qu'à moins d'un kilomètre
  d'une rue : une ville, c'est là où passent les voies, et la mer n'en a aucune.
  Le coût de ce calcul **ne dépend pas du rayon cherché** — c'est tout son
  intérêt : la recherche naïve qu'il remplace devenait un ordre de grandeur plus
  lente dès qu'on élargissait le rayon. Perpignan et ses 17 373 bâtiments se
  construisent en 150 à 185 ms.

Le tirage est **déterministe** (`hasard.js`, graine fixe) : la même ville rend
toujours le même décor.

### 4.4 Le rendu et les outils

`rendu.js` dessine dans l'ordre : le sol, les abords, les parcs, les plans d'eau,
le cours d'eau, le littoral, le réseau de voies, puis les bâtiments.

Quatre outils, dans deux canvas superposés — le fond ne peut donc jamais être
abîmé par le dessin :

- **Feutre** — trait au geste maintenu (`coloration.js`, tracé dans `traceur.js`) ;
- **Coloriage** — un appui remplit la zone visée en suivant les contours
  (`remplissage.js`, remplissage par balayage de lignes). Seuls le point visé et
  la couleur sont enregistrés : **la zone est recalculée à l'affichage**, sur les
  pixels réellement dessinés, ce qui la garde juste à toute échelle ;
- **Texte** — zones déplaçables, modifiables seulement sous cet outil, pour qu'un
  appui au feutre ne saisisse pas un texte par mégarde ;
- **Gomme** — n'efface que ce qui a été ajouté, jamais le fond.

Changer de ville efface le coloriage, les textes et les emplacements : leurs
mètres désigneraient n'importe quoi sur une autre carte. Les lieux et leurs noms,
eux, sont conservés. Regénérer la *même* ville ne touche à rien.

## 5. La page invitée

L'ordre est inhabituel et volontaire : **la carte de la ville s'affiche d'abord**,
et la demande de mot de passe se pose par-dessus. Rien du contenu de l'expérience
n'est chargé à ce stade — `GET /api/experiences/:slug/ville` ne rend que la ville.

1. `POST /:slug/connexion` compare le mot de passe à l'empreinte scrypt. En cas de
   succès, un **jeton signé** (HMAC) est déposé en cookie pour 12 h. Il ne contient
   que l'adresse autorisée et sa date d'expiration : ni mot de passe, ni empreinte.
2. `protegerLExperience` garde toutes les autres routes. Le cookie doit désigner
   **exactement** l'adresse demandée : un accès à une expérience n'en ouvre aucune autre.
3. **Un lien inexistant et un mauvais mot de passe donnent exactement la même
   réponse.** Mieux : une adresse inconnue est comparée à une **empreinte leurre**,
   pour qu'elle coûte le même temps qu'une vraie — sans quoi un chronomètre
   suffirait à deviner quelles adresses existent. Chaque échec ralentit un peu
   plus la réponse suivante (250 ms de plus à chaque fois, jusqu'à 2 s), et au
   bout de 8 essais en 15 minutes la porte se ferme.

L'invité dessine, retient une des dates proposées, en propose jusqu'à 3 autres, et
peut ajouter des lieux dans la limite globale de 5. Dessin, textes et réponse ont
chacun leur route, et tout est revalidé côté serveur. Une notification ntfy part
alors, depuis le serveur uniquement.

Les créneaux proposés commencent au plus tôt 2 h avant l'ouverture du lieu et au
plus tard 1 h avant sa fermeture, minutes de 5 en 5, plages multiples et fermeture
après minuit comprises. La règle est écrite une fois dans
`serveur/utilitaires/creneaux.js` et reprise à l'identique dans
`public/scripts/commun/creneaux.js` pour ne proposer que des heures valables —
mais **le serveur reste seul juge**.

## 6. Où vivent les données

`serveur/services/entrepot.js` choisit seul : Upstash Redis si les variables sont
présentes, fichiers JSON de `donnees/` sinon. Le reste du code ignore lequel des
deux répond. Deux formes seulement :

| Forme | Exemples | Opérations |
| --- | --- | --- |
| **Collections** | journal des clics, réservations, dessins, textes | ajouter, lister |
| **Documents** | villes, fonds de carte, expériences | lire, écrire, **créer si absent** |

`creerDocumentSiAbsent` est l'opération qui garantit qu'une adresse n'est jamais
attribuée deux fois.

## 7. Ce qui protège l'ensemble

- **Rien du navigateur n'est repris tel quel** : slug, lieux, horaires, dates,
  positions et traits sont tous revalidés côté serveur.
- **L'adresse est tirée par le serveur**, jamais proposée par le navigateur.
- **Les mots de passe sont hachés avec scrypt.** Aucune empreinte ne sort.
- **Limites** : 5 lieux par expérience, 3 propositions par invité, 20 zones de
  texte, 400 points par trait, 12 disponibilités.
- **Quotas d'envoi** par fenêtre de 10 minutes, comptés séparément par usage et à
  la fois par visiteur et par adresse IP — vider ses cookies ne les remet pas à
  zéro : 10 villes, 60 recherches de lieux, 6 créations.
- **Aucun secret côté navigateur.** Nominatim et Overpass ne demandent ni compte ni
  clé. Avant d'ajouter un autre service, vérifier qu'il n'impose pas une clé à
  cacher, et le documenter dans `.env.example`.

## 8. Les vérifications

```bash
npm run verifier   # syntaxe, limite de 150 lignes, identifiants et chargement des pages
npm test           # les vérifications ci-dessus + les tests de bout en bout
```

Quatre contrôles statiques puis les scénarios :

1. **`verifier-syntaxe.js`** — chaque fichier JavaScript s'analyse ;
2. **`verifier-lignes.js`** — aucun `.js`, `.css` ou `.html` ne dépasse 150 lignes ;
3. **`verifier-pages.js`** — chaque page contient les identifiants que ses scripts
   demandent ;
4. **`verifier-chargement.js`** — chaque page est **exécutée dans un DOM simulé**
   (`dom-simule.js`). Un module qui explose au démarrage laisse la page inerte
   alors que la syntaxe est bonne et que tous les imports existent : c'est
   exactement ce qui était arrivé, un formulaire sans gestionnaire partant en
   soumission native. Aucun contrôle statique ne le voyait ;
5. **`verifier-experiences.js`** — 211 vérifications de bout en bout : création,
   règles horaires, accès invité, limites, administration, cadrage, décor, banque
   de mots. Aucun service extérieur n'est appelé, la ville d'essai est écrite
   directement dans l'entrepôt.

En ajouter dès qu'une règle métier nouvelle apparaît.

---

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

Les seuls secrets sont `SECRET_SIGNATURE`, les identifiants d'administration, les
jetons Upstash et le sujet ntfy. Les services OpenStreetMap sont ouverts et ne
demandent aucune clé.

Secret aléatoire : `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Déploiement sur Vercel

Le disque de Vercel est en lecture seule et les instances sont multiples : le
journal et les réservations passent donc par **Upstash Redis** (intégration du
Marketplace Vercel). Sans variables Upstash, le projet retombe automatiquement sur
les fichiers JSON de `donnees/` — pratique en local, inutilisable en ligne.

```bash
vercel link
vercel integration add upstash/upstash-kv --plan free -m primaryRegion=fra1
vercel deploy --prod
```

Le dépôt est relié à GitHub : un envoi sur `main` déclenche le déploiement, et la
GitHub Action `.github/workflows/verification.yml` rejoue `npm test` sur Node 20
et 24.

## Organisation

```
api/index.js          point d'entrée Vercel
serveur/index.js      démarrage local
serveur/application.js  assemblage : middlewares, routes, erreurs
serveur/routes/       une famille de routes par fichier
serveur/services/     métier et accès aux données
serveur/middlewares/  session visiteur, protections, limitation des envois
serveur/utilitaires/  fonctions pures : validation, horaires, géométrie, mots de passe
serveur/donnees/      banque de mots des adresses, catégories OpenStreetMap

public/scripts/carte/     moteur de la carte : projection, décor, rendu, coloriage
public/scripts/commun/    atelier de carte, placement, horaires, créneaux, fenêtres
public/scripts/creation/  page /create
public/scripts/invite/    page invitée
public/fragments/         fenêtres partagées par /create et la page invitée

donnees/              journal des clics et réservations (JSON, généré)
donnees/documents/    villes, fonds de carte et expériences (JSON, généré)
scripts-verification/ contrôles statiques et tests de bout en bout
```

## Attribution

Les fonds de carte proviennent d'**OpenStreetMap** (© les contributeurs
OpenStreetMap, licence ODbL), extraits à la demande via l'API Overpass, simplifiés
et convertis en mètres relatifs au centre de la ville. Toute diffusion publique du
site doit conserver cette attribution.
