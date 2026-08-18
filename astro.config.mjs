import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  // Project Pages:
  //   https://tamasszentandrasi.github.io/Kodranni/           → repo portal
  //   https://tamasszentandrasi.github.io/Kodranni/Guidebook/ → this site
  // When you attach a custom domain (e.g. kodranni.com), set:
  //   site: 'https://kodranni.com',
  //   base: '/',
  // and put that hostname in public/CNAME (see README). Deploy then uploads dist flat.
  site: 'https://tamasszentandrasi.github.io',
  base: '/Kodranni/Guidebook',
  integrations: [
    starlight({
      title: 'Kodranni',
      description: 'A pre-industrial grim human TTRPG system.',
      logo: {
        src: './src/assets/falcon-logo.png',
        alt: 'Kodranni',
      },
      // Prefer ICO for tab icons (SVG was unreliable; PNG alone is flaky on some browsers).
      // Head.astro also emits a full multi-size set under the correct base path.
      favicon: '/favicon.ico',
      sidebar: [
        {
          label: 'Start here',
          items: [{ label: 'Introduction', link: '/introduction/' }],
        },
        {
          label: 'Dice Mechanics',
          items: [
            { label: 'Overview', link: '/dice-mechanics/' },
            { label: 'Marks & Tiers', link: '/marks-and-tiers/' },
            { label: 'Omens & Consequences', link: '/omens/' },
            { label: 'Tide', link: '/tide/' },
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
            { label: 'Echoes', link: '/echoes/' },
            { label: 'Harm', link: '/harm/' },
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
          items: [{ label: 'At the Table', link: '/automation/' }],
        },
        {
          label: 'Reference',
          items: [{ label: 'Glossary', link: '/glossary/' }],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      lastUpdated: false,
      pagination: true,
      components: {
        Head: './src/components/starlight/Head.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
      },
    }),
  ],
});
