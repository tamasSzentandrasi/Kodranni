import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  // Set when deploying, e.g. 'https://kodranni.example.com'
  // site: 'https://example.com',
  integrations: [
    starlight({
      title: 'Kodranni',
      description: 'A pre-industrial grim human TTRPG system.',
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Introduction', link: '/introduction/' },
            { label: 'Dice Mechanics', link: '/dice-mechanics/' },
            { label: 'Glossary', link: '/glossary/' },
          ],
        },
        {
          label: 'Human Potential',
          items: [
            { label: 'Overview', link: '/human-potential/' },
            { label: 'Foundations', link: '/foundations/' },
            { label: 'Skills', link: '/skills/' },
            { label: 'Traits', link: '/traits/' },
            { label: 'Exertion', link: '/exertion/' },
          ],
        },
        {
          label: 'Resolution & Continuity',
          items: [
            { label: 'Harm', link: '/harm/' },
            { label: 'Echoes', link: '/echoes/' },
            { label: 'Hierarchies', link: '/hierarchies/' },
            { label: 'Inventory', link: '/inventory/' },
          ],
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Campaign Setup', link: '/campaign-setup/' },
            { label: 'Character Creation', link: '/character-creation/' },
          ],
        },
        {
          label: 'Automation',
          items: [
            { label: 'At the Table', link: '/automation/' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      pagination: true,
      components: {
        PageTitle: './src/components/starlight/PageTitle.astro',
      },
    }),
  ],
});
