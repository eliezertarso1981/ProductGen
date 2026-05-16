import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  projectSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Produto',
      items: ['product/overview', 'product/lifecycle'],
    },
    {
      type: 'category',
      label: 'Arquitetura',
      items: ['architecture/overview', 'architecture/database'],
    },
    {
      type: 'category',
      label: 'Backend',
      items: ['backend/development', 'backend/testing'],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/openapi'],
    },
  ],
};

export default sidebars;
