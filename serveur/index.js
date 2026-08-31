// Demarrage local : c'est ce point d'entree qu'utilise `npm start`.
import { configuration } from './config.js';
import { application } from './application.js';

application.listen(configuration.port, () => {
  console.log(`Site disponible sur http://localhost:${configuration.port}`);
});
