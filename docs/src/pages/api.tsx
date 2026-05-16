import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import '@scalar/api-reference/style.css';

function ScalarReference(): ReactNode {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    import('@scalar/api-reference').then(({ createApiReference }) => {
      if (!mounted || !containerRef.current) return;

      containerRef.current.replaceChildren();
      createApiReference(containerRef.current, {
        url: '/openapi/productgen.json',
        theme: 'default',
        layout: 'modern',
      });
    });

    return () => {
      mounted = false;
      containerRef.current?.replaceChildren();
    };
  }, []);

  return <div className="scalar-api-reference" ref={containerRef} />;
}

export default function ApiReferencePage(): ReactNode {
  return (
    <Layout title="API Reference" description="Referência interativa da API ProductGen">
      <BrowserOnly fallback={<div className="container margin-vert--lg">Carregando API Reference...</div>}>
        {() => <ScalarReference />}
      </BrowserOnly>
    </Layout>
  );
}
