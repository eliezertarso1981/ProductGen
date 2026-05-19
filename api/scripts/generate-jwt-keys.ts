/**
 * Gera par RS256 (PKCS#8 + SPKI) pronto para colar no Railway.
 * Uso: npm run jwt:keys
 */
import { generateKeyPairSync, randomBytes } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

function railwayLine(name: string, pem: string): void {
  const escaped = pem.trim().replace(/\r\n/g, '\n').replace(/\n/g, '\\n');
  console.log(`${name}=${escaped}`);
}

console.log('# Cole no serviço API da Railway (Variables). Sem aspas extras.\n');
railwayLine('JWT_PRIVATE_KEY', privateKey);
railwayLine('JWT_PUBLIC_KEY', publicKey);
console.log('\n# COOKIE_SECRET (opcional, se ainda não tiver um com ≥ 32 caracteres):');
console.log(`COOKIE_SECRET=${randomBytes(32).toString('hex')}`);
