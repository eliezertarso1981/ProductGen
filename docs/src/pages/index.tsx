import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import styles from './index.module.css';

const sections = [
  {
    title: 'Produto',
    description: 'Contexto de domínio, fluxo discovery to delivery e decisões de produto.',
    to: '/docs/intro',
  },
  {
    title: 'Arquitetura',
    description: 'Como Postgres, RLS, audit log, lifecycle e backend Fastify se conectam.',
    to: '/docs/architecture/overview',
  },
  {
    title: 'API Reference',
    description: 'Referência interativa gerada pelo OpenAPI do backend e renderizada com Scalar.',
    to: '/api',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="ProductGen Docs"
      description="Documentação técnica e de produto do ProductGen">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="container">
            <p className={styles.eyebrow}>ProductGen</p>
            <h1>Documentação viva do projeto</h1>
            <p className={styles.subtitle}>
              Um lugar único para produto, arquitetura, banco, backend, testes e API.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/intro">
                Começar pela visão geral
              </Link>
              <Link className="button button--secondary button--lg" to="/api">
                Abrir API Reference
              </Link>
            </div>
          </div>
        </section>

        <section className="container">
          <div className={styles.grid}>
            {sections.map((section) => (
              <Link className={styles.card} key={section.title} to={section.to}>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
