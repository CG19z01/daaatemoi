# CLAUDE.md

## Projet

Plateforme de propositions de rendez-vous illustrées, en noir et blanc au trait.

Deux expériences cohabitent :

- **la carte de Rouen d'origine** (`/carte`) : trois lieux choisis, coloriage
  partagé, réservation, journal des clics et administration. Elle fonctionne :
  elle ne se modifie pas sans demande explicite.
- **les expériences personnalisées** (`/create`) : n'importe qui compose son propre
  date — une ville, jusqu'à 5 lieux placés à la main, ses disponibilités — puis
  partage un lien protégé par mot de passe, de la forme
  `/trois-mots-romantiques-for-you`. Sur la carte : Feutre, Coloriage, Texte et
  Gomme, la gomme n'effaçant que ce que l'utilisateur a ajouté.

Le projet doit être :

- léger
- rapide
- responsive
- sécurisé
- facile à maintenir
- visuellement fun
- romantique
- avec un style cartoon

---

# Règles prioritaires

Toujours respecter les règles suivantes avant d'écrire ou modifier du code.

1. Lire ce fichier avant toute modification.
2. Ne pas supprimer de fichier existant sans autorisation.
3. Ne pas créer de dépendance sans raison valable.
4. Préférer la solution la plus simple et légère.
5. Ne jamais dépasser 150 lignes dans un fichier source.
6. Découper les fichiers avant d'atteindre cette limite.
7. Ne pas contourner la limite avec du code compact ou illisible.
8. Toujours privilégier la lisibilité.
9. Toujours vérifier le projet après modification importante.
10. Corriger les erreurs détectées avant de terminer.
11. Ne jamais casser la carte de Rouen, l'administration ni les rendez-vous existants.
12. Lancer `npm test` avant de considérer une modification terminée.

---

# Limite des fichiers

Aucun fichier source ne doit dépasser :

150 lignes

Cela concerne notamment :

- composants
- routes
- services
- utilitaires
- scripts
- styles si possible

Si un fichier approche 150 lignes :

1. identifier ses responsabilités
2. séparer les responsabilités
3. créer plusieurs modules cohérents
4. conserver des imports simples

Ne jamais créer un gros fichier central.

---

# Langue du code

Tous les noms créés dans le projet doivent être en français.

Cela concerne :

- variables
- constantes
- fonctions
- services
- fichiers métier
- types
- interfaces lorsque cela reste compatible avec la technologie utilisée

## Bons exemples

```text
listeDesLieux
lieuSelectionne
dateDeReservation
enregistrerReservation
recupererLesLieux
journalDesClics
verifierAuthentification
composerUnSlug
hacherLeMotDePasse
plagesDeCreneaux
placementEnCours
```

---

# Architecture

```text
serveur/routes/           une famille de routes par fichier
serveur/services/         métier et accès aux données
serveur/utilitaires/      fonctions pures : validation, horaires, géométrie, mots de passe
serveur/middlewares/      session visiteur, protections, limitation des envois
serveur/donnees/          sources fixes : lieux de Rouen, vocabulaire des adresses

public/scripts/carte/     carte de Rouen, dont les modules servent aussi ailleurs
public/scripts/commun/    scène de carte, placement, horaires, créneaux, fenêtres
public/scripts/creation/  page /create
public/scripts/invite/    page invitée
public/fragments/         fenêtres partagées par /create et la page invitée
```

Regarder `public/scripts/commun/` avant d'écrire un nouveau module : la scène de
carte, le placement d'un point et les sélecteurs d'heure y servent déjà les deux pages.

---

# Données

`serveur/services/entrepot.js` choisit seul : Upstash Redis en ligne, fichiers JSON
en local. Deux formes : les **collections** (journal, réservations, dessins) et les
**documents** (villes, fonds de carte, expériences). L'écriture exclusive
`creerDocumentSiAbsent` garantit qu'une adresse n'est jamais attribuée deux fois.

Chaque lieu porte la **couleur de son point**, propre à lui et sans rapport avec
la couleur du feutre. Les **zones de texte** et le **coloriage** vivent dans leurs
propres collections, `textes-<slug>` et `dessin-<slug>`. Un remplissage ne retient
que le point visé et sa couleur : la zone est recalculée à l'affichage, sur les
pixels réellement dessinés, ce qui la garde juste à toute échelle.

Toute position posée sur la carte — point d'un lieu, zone de texte, remplissage —
est enregistrée **en mètres relatifs au centre de la ville**, jamais en pixels.

Horaires d'une expérience, une entrée par jour :

```text
null                             -> horaires non renseignés
[]                               -> fermé ce jour-là
[{ ouverture, fermeture }, ...]  -> une ou plusieurs plages d'ouverture
```

À ne pas confondre avec ceux de `serveur/donnees/lieux.js`, propres à la carte de
Rouen, qui gardent leur forme d'origine.

Le cadrage n'est jamais un zoom fixe : le serveur mesure la zone bâtie de la ville
(`zone-batie.js`, par percentiles pour ignorer les routes de campagne) et la
projection l'ajuste ensuite à l'écran. Un fond produit par une version antérieure
est régénéré, via `VERSION_DU_FOND`.

Créneaux : minutes de 5 en 5 partout, début au plus tôt 2 h avant l'ouverture du
lieu et au plus tard 1 h avant sa fermeture, plages multiples et fermeture après
minuit comprises. Source unique `serveur/utilitaires/creneaux.js`, reprise à
l'identique dans `public/scripts/commun/creneaux.js` pour ne proposer que des heures
valables — le serveur reste seul juge.

---

# Sécurité

- Rien de ce qui vient du navigateur n'est repris tel quel : slug, lieux, horaires,
  dates et positions des points sont tous revalidés côté serveur.
- Le slug est tiré au sort par le serveur, jamais proposé par le navigateur.
- Les mots de passe des expériences sont hachés avec scrypt
  (`serveur/utilitaires/mot-de-passe.js`). Aucune empreinte ne quitte le serveur.
- Un lien inexistant et un mauvais mot de passe donnent exactement la même réponse.
- Limites à faire respecter : 5 lieux par expérience, 3 propositions par invité.
- Aucun secret côté navigateur. Nominatim et Overpass (OpenStreetMap) ne demandent
  ni compte ni clé, et sont appelés depuis le serveur. Avant d'ajouter un autre
  service, vérifier qu'il n'impose pas une clé à cacher, et le documenter
  dans `.env.example`.

---

# Vérifications

```bash
npm run verifier   # syntaxe, limite de 150 lignes, identifiants des pages
npm test           # les vérifications ci-dessus + les tests de bout en bout
```

Les tests couvrent la création, les règles horaires, l'accès invité, les limites et
l'administration. En ajouter dès qu'une règle métier nouvelle apparaît.
