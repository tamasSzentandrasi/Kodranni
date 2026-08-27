import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  // Custom domain kodranni.com: portal at /, book at /Guidebook/.
  // GitHub Pages still builds the same tree; attach the domain in repo Settings → Pages.
  site: 'https://kodranni.com',
  base: '/Guidebook',
  integrations: [
    starlight({
      title: 'Kodranni',
      description: 'A pre-industrial grim human TTRPG system.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        hu: { label: 'Magyar', lang: 'hu' },
      },
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
          translations: { hu: 'Itt kezdődik' },
          items: [
            {
              label: 'Introduction',
              translations: { hu: 'Bevezetés' },
              link: '/introduction/',
            },
          ],
        },
        {
          label: 'Dice Mechanics',
          translations: { hu: 'Kockamechanika' },
          items: [
            { label: 'Overview', translations: { hu: 'Áttekintés' }, link: '/dice-mechanics/' },
            { label: 'Marks & Tiers', translations: { hu: 'Jelek és kockafokok' }, link: '/marks-and-tiers/' },
            { label: 'Omens & Consequences', translations: { hu: 'Ómenek és következmények' }, link: '/omens/' },
            { label: 'Tide', translations: { hu: 'Sodrás' }, link: '/tide/' },
          ],
        },
        {
          label: 'Human Potential',
          translations: { hu: 'Emberi adottságok' },
          items: [
            { label: 'Overview', translations: { hu: 'Áttekintés' }, link: '/human-potential/' },
            { label: 'Foundations', translations: { hu: 'Adottságok' }, link: '/foundations/' },
            { label: 'Skills', translations: { hu: 'Jártasságok' }, link: '/skills/' },
            { label: 'Traits', translations: { hu: 'Vonások' }, link: '/traits/' },
            { label: 'Exertion', translations: { hu: 'Erőfeszítés' }, link: '/exertion/' },
          ],
        },
        {
          label: 'Resolution & Continuity',
          translations: { hu: 'Feloldás és folytonosság' },
          items: [
            { label: 'Echoes', translations: { hu: 'Visszhangok' }, link: '/echoes/' },
            { label: 'Harm', translations: { hu: 'Sérülés' }, link: '/harm/' },
            { label: 'Hierarchies', translations: { hu: 'Hierarchiák' }, link: '/hierarchies/' },
            { label: 'Inventory', translations: { hu: 'Felszerelés' }, link: '/inventory/' },
          ],
        },
        {
          label: 'Campaign & Character Creation',
          translations: { hu: 'Kampány és karakteralkotás' },
          items: [
            { label: 'Campaign Setup', translations: { hu: 'Kampányelőkészítés' }, link: '/campaign-setup/' },
            { label: 'Character Creation', translations: { hu: 'Karakteralkotás' }, link: '/character-creation/' },
          ],
        },
        {
          label: 'Automation',
          translations: { hu: 'Automatizálás' },
          items: [{ label: 'At the Table', translations: { hu: 'Az asztalnál' }, link: '/automation/' }],
        },
        {
          label: 'Reference',
          translations: { hu: 'Névtár' },
          items: [{ label: 'Glossary', translations: { hu: 'Fogalomtár' }, link: '/glossary/' }],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      lastUpdated: false,
      pagination: true,
      components: {
        Head: './src/components/starlight/Head.astro',
        PageTitle: './src/components/starlight/PageTitle.astro',
        SiteTitle: './src/components/starlight/SiteTitle.astro',
        ThemeSelect: './src/components/starlight/ThemeSelect.astro',
        ThemeProvider: './src/components/starlight/ThemeProvider.astro',
        LanguageSelect: './src/components/starlight/LanguageSelect.astro',
      },
    }),
  ],
});
