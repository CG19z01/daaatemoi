// Correspondance entre les mots que l'on tape en français et les étiquettes
// d'OpenStreetMap, qui sont en anglais. Sans cette table, chercher « cathédrale »
// ou « musée » ne trouverait rien, alors que les lieux existent bien.
//
// Chaque entrée donne une ou plusieurs paires [famille, valeur].
export const CATEGORIES_FRANCAISES = {
  cathedrale: [['building', 'cathedral'], ['amenity', 'place_of_worship']],
  eglise: [['building', 'church'], ['amenity', 'place_of_worship']],
  abbaye: [['building', 'abbey'], ['historic', 'monastery']],
  chapelle: [['building', 'chapel']],
  musee: [['tourism', 'museum']],
  monument: [['historic', 'monument'], ['historic', 'memorial']],
  memorial: [['historic', 'memorial']],
  chateau: [['historic', 'castle'], ['building', 'castle']],
  ruines: [['historic', 'ruins']],
  statue: [['historic', 'memorial'], ['tourism', 'artwork']],
  fontaine: [['amenity', 'fountain']],
  parc: [['leisure', 'park']],
  jardin: [['leisure', 'garden']],
  square: [['leisure', 'park'], ['place', 'square']],
  place: [['place', 'square']],
  'point de vue': [['tourism', 'viewpoint']],
  belvedere: [['tourism', 'viewpoint']],
  attraction: [['tourism', 'attraction']],
  galerie: [['tourism', 'gallery'], ['tourism', 'artwork']],
  theatre: [['amenity', 'theatre']],
  cinema: [['amenity', 'cinema']],
  bibliotheque: [['amenity', 'library']],
  marche: [['amenity', 'marketplace']],
  pont: [['man_made', 'bridge']],
  tour: [['man_made', 'tower']],
  phare: [['man_made', 'lighthouse']],
  restaurant: [['amenity', 'restaurant']],
  bar: [['amenity', 'bar'], ['amenity', 'pub']],
  cafe: [['amenity', 'cafe']],
  glacier: [['amenity', 'ice_cream']],
  patisserie: [['shop', 'pastry']],
  librairie: [['shop', 'books']],
  zoo: [['tourism', 'zoo']],
  aquarium: [['tourism', 'aquarium']],
  plage: [['natural', 'beach']],
};

// Familles d'étiquettes explorées pour une recherche par nom. Elles couvrent
// aussi bien les établissements que les lieux d'intérêt et les monuments.
export const FAMILLES = ['amenity', 'shop', 'leisure', 'tourism', 'historic', 'man_made'];
