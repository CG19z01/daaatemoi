// Vocabulaire romantique servant a composer les adresses des experiences.
// Contrainte : uniquement des lettres latines non accentuees, pour qu'une
// adresse reste tapable sur n'importe quel clavier latin et lisible dans une
// URL. Les langues qui n'utilisent pas l'alphabet latin sont donc presentes
// sous leur translitteration usuelle (jamais leurs caracteres d'origine).
export const motsRomantiques = [
  // Francais
  'amour', 'cheri', 'tendresse', 'calin', 'bisou', 'coeur', 'douceur', 'toujours',
  // Anglais
  'love', 'sweet', 'honey', 'darling', 'forever', 'cuddle', 'lovely', 'crush',
  // Italien
  'amore', 'cuore', 'tesoro', 'dolcezza', 'bacio', 'stella', 'sempre', 'carina',
  // Espagnol
  'corazon', 'querida', 'besito', 'carino', 'dulce', 'alma', 'vida', 'linda',
  // Portugais
  'saudade', 'carinho', 'amado', 'beijo', 'coracao', 'ternura', 'fofinho',
  // Latin et esperanto
  'amor', 'carus', 'dulcis', 'anima', 'amiko', 'kara',
  // Catalan, occitan, basque
  'estimo', 'cor', 'amoreta', 'maitea', 'bihotza',
  // Allemand et neerlandais
  'liebe', 'schatz', 'herz', 'kuss', 'suess', 'liefje', 'hartje', 'lieveling',
  // Scandinave
  'hjarta', 'alskling', 'karlek', 'gullig', 'kjaere', 'elskede', 'hjerte',
  // Slave (translitteration latine pour le cyrillique)
  'kochanie', 'serce', 'milosc', 'laska', 'milacek', 'lyubov', 'serdtse', 'milaya',
  // Grec, roumain, hongrois, finnois
  'agapi', 'kardia', 'filaki', 'glykia', 'iubire', 'draga', 'inima',
  'szerelem', 'szivem', 'edes', 'rakkaus', 'kulta', 'sydan',
  // Turc
  'sevgi', 'askim', 'canim', 'tatlim', 'gonul',
  // Arabe et hebreu, en translitteration latine
  'habibi', 'hayati', 'albi', 'ahava', 'neshama',
  // Hindi et ourdou, en translitteration latine
  'pyaar', 'prem', 'jaan', 'mohabbat', 'sanam',
  // Asie de l'Est et du Sud-Est, en translitteration latine
  'koi', 'suki', 'kokoro', 'sarang', 'aishite', 'cinta', 'sayang', 'kasih',
  'manis', 'rindu', 'thuong', 'mahal', 'irog',
  // Afrique et Oceanie
  'mapenzi', 'moyo', 'penda', 'uthando', 'aloha', 'aikane', 'wahine',
  // Celtique
  'cariad', 'calon', 'cushla', 'mavourneen', 'graine',
];
