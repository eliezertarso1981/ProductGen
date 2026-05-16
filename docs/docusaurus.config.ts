import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'ProductGen Docs',
  tagline: 'Documentação viva do produto, backend, banco e API',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'http://localhost:3002',
  baseUrl: '/',
  organizationName: 'productgen',
  projectName: 'productgen',

  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'ProductGen',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'projectSidebar',
          position: 'left',
          label: 'Documentação',
        },
        {
          to: '/api',
          label: 'API Reference',
          position: 'left',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Projeto',
          items: [
            { label: 'Visão geral', to: '/docs/intro' },
            { label: 'Arquitetura', to: '/docs/architecture/overview' },
            { label: 'Banco de dados', to: '/docs/architecture/database' },
          ],
        },
        {
          title: 'API',
          items: [
            { label: 'Referência Scalar', to: '/api' },
            { label: 'OpenAPI JSON', href: 'pathname:///openapi/productgen.json' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ProductGen.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
