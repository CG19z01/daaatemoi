// Petits outils de test, sans aucune dependance : l'application est demarree
// sur un port libre et interrogee comme le ferait un navigateur.
let echecs = 0;
let reussites = 0;

export const verifier = (condition, intitule) => {
  if (condition) {
    reussites += 1;
    console.log(`  ok   ${intitule}`);
    return;
  }
  echecs += 1;
  console.error(`  ECHEC ${intitule}`);
};

export const titre = (texte) => console.log(`\n${texte}`);

export const bilan = () => {
  console.log(`\n${reussites} verification(s) reussie(s), ${echecs} echec(s).`);
  return echecs === 0;
};

// Client HTTP minimal qui conserve les cookies, comme un navigateur.
export const creerClient = (adresseDeBase) => {
  let cookies = new Map();

  const retenirLesCookies = (reponse) => {
    for (const entete of reponse.headers.getSetCookie?.() ?? []) {
      const [paire] = entete.split(';');
      const separateur = paire.indexOf('=');
      if (separateur > 0) cookies.set(paire.slice(0, separateur).trim(), paire.slice(separateur + 1));
    }
  };

  const appeler = async (chemin, options = {}) => {
    const entetes = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
    if (cookies.size > 0) {
      entetes.Cookie = [...cookies].map(([nom, valeur]) => `${nom}=${valeur}`).join('; ');
    }
    const reponse = await fetch(`${adresseDeBase}${chemin}`, { ...options, headers: entetes });
    retenirLesCookies(reponse);
    const texte = await reponse.text();
    let donnees = null;
    try {
      donnees = JSON.parse(texte);
    } catch {
      donnees = { texte };
    }
    return { statut: reponse.status, donnees, texte };
  };

  return {
    appeler,
    envoyer: (chemin, corps, options = {}) =>
      appeler(chemin, { method: 'POST', body: JSON.stringify(corps), ...options }),
    oublierLesCookies: () => {
      cookies = new Map();
    },
  };
};
