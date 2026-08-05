import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Kodranni',
      description: 'A pre-industrial grim human TTRPG system.',
      social: [],
      sidebar: [
        {
          label: 'Guidebook',
          items: [
            { label: 'Introduction', link: '/introduction/' },
            { label: 'Human Potential', link: '/human-potential/' },
            { label: 'Foundations', link: '/foundations/' },
            { label: 'Skills', link: '/skills/' },
            { label: 'Traits', link: '/traits/' },
            { label: 'Exertion', link: '/exertion/' },
            { label: 'Dice Mechanics', link: '/dice-mechanics/' },
            { label: 'Echoes', link: '/echoes/' },
            { label: 'Harm', link: '/harm/' },
            { label: 'Hierarchies', link: '/hierarchies/' },
            { label: 'Inventory', link: '/inventory/' },
            { label: 'Character Creation', link: '/character-creation/' },
          ],
        },
      ],
      customCss: [
        './src/styles/custom.css',
      ],
    }),
  ],
});
