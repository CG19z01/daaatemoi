// DOM minimal et permissif, uniquement pour voir si un module de page explose
// au chargement. Tout element demande existe, tout appel inconnu ne fait rien :
// on ne simule pas un navigateur, on cherche une erreur de programmation.
const rien = () => {};

const contexteDeDessin = new Proxy({}, {
  get: (_, propriete) => {
    if (propriete === 'canvas') return { width: 1200, height: 800 };
    if (propriete === 'getImageData' || propriete === 'createImageData') {
      return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
    }
    if (propriete === 'measureText') return () => ({ width: 10 });
    return rien;
  },
});

const creerUnElement = (identifiant = '') => ({
  id: identifiant,
  tagName: 'DIV',
  hidden: false,
  textContent: '',
  value: '',
  disabled: false,
  checked: false,
  style: {},
  dataset: {},
  children: [],
  width: 1200,
  height: 800,
  classList: { add: rien, remove: rien, toggle: () => false, contains: () => false },
  addEventListener: rien,
  removeEventListener: rien,
  setAttribute: rien,
  getAttribute: () => null,
  removeAttribute: rien,
  append: rien,
  appendChild: rien,
  insertBefore: rien,
  replaceChildren: rien,
  remove: rien,
  contains: () => false,
  closest: () => null,
  querySelector: () => creerUnElement(),
  querySelectorAll: () => [],
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1200, height: 800 }),
  getContext: () => contexteDeDessin,
  focus: rien,
  showModal: rien,
  close: rien,
});

// Le meme identifiant rend toujours le meme element, comme dans une vraie page.
export const installerLeDomSimule = () => {
  const elements = new Map();
  globalThis.document = {
    body: creerUnElement('body'),
    documentElement: creerUnElement('html'),
    getElementById: (identifiant) => {
      if (!elements.has(identifiant)) elements.set(identifiant, creerUnElement(identifiant));
      return elements.get(identifiant);
    },
    querySelector: () => creerUnElement(),
    querySelectorAll: () => [],
    createElement: (balise) => ({ ...creerUnElement(), tagName: balise.toUpperCase() }),
    createTextNode: () => creerUnElement(),
    createRange: () => ({ createContextualFragment: () => creerUnElement() }),
    addEventListener: rien,
  };
  globalThis.window = {
    addEventListener: rien,
    devicePixelRatio: 1,
    innerWidth: 1200,
    innerHeight: 800,
    location: { pathname: '/create', href: 'http://exemple/create', search: '' },
    matchMedia: () => ({ matches: false, addEventListener: rien }),
  };
  globalThis.location = globalThis.window.location;
  globalThis.navigator = { clipboard: { writeText: rien }, userAgent: 'verification' };
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => '<div></div>',
    json: async () => ({}),
  });
};
