// Signature et verification de jetons de cookie (HMAC SHA-256, aucune dependance).
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { configuration } from '../config.js';

const encoderBase64Url = (texte) => Buffer.from(texte, 'utf8').toString('base64url');
const decoderBase64Url = (texte) => Buffer.from(texte, 'base64url').toString('utf8');

const calculerEmpreinte = (charge) =>
  createHmac('sha256', configuration.secretDeSignature).update(charge).digest('base64url');

export const genererIdentifiantAleatoire = () => randomBytes(24).toString('hex');

export const signerJeton = (contenu) => {
  const charge = encoderBase64Url(JSON.stringify(contenu));
  return `${charge}.${calculerEmpreinte(charge)}`;
};

export const verifierJeton = (jeton) => {
  if (typeof jeton !== 'string' || !jeton.includes('.')) return null;
  const [charge, empreinte] = jeton.split('.');
  if (!charge || !empreinte) return null;
  const attendue = Buffer.from(calculerEmpreinte(charge));
  const recue = Buffer.from(empreinte);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  try {
    return JSON.parse(decoderBase64Url(charge));
  } catch {
    return null;
  }
};

export const comparerSecrets = (valeurRecue, valeurAttendue) => {
  const recue = createHmac('sha256', configuration.secretDeSignature).update(String(valeurRecue)).digest();
  const attendue = createHmac('sha256', configuration.secretDeSignature).update(String(valeurAttendue)).digest();
  return timingSafeEqual(recue, attendue);
};
