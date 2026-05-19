import { buildApp } from './app';
import { config } from './config/env';
import { validateJwtKeys } from './auth/jwt';
import { captureException, initSentry } from './sentry';

initSentry();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  captureException(reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  captureException(err);
  process.exit(1);
});

const app = buildApp();

const start = async () => {
  try {
    await validateJwtKeys();
  } catch (err) {
    console.error(
      'JWT_PRIVATE_KEY / JWT_PUBLIC_KEY inválidas. Use PEM PKCS#8/SPKI; no Railway, quebre linhas com \\n:',
      err,
    );
    captureException(err);
    process.exit(1);
  }

  try {
    await app.listen({ port: config.PORT, host: '0.0.0.0' });
    console.log(`API listening on 0.0.0.0:${config.PORT} (NODE_ENV=${config.NODE_ENV})`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
