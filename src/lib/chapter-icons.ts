/**
 * Chapter icons via Vite `?url` so `base: '/Kodranni/Guidebook'` is applied correctly.
 */
import automation from '../assets/icons/automation.png?url';
import campaignSetup from '../assets/icons/campaign-setup.png?url';
import characterCreation from '../assets/icons/character-creation.png?url';
import diceMechanics from '../assets/icons/dice-mechanics.png?url';
import echoes from '../assets/icons/echoes.png?url';
import exertion from '../assets/icons/exertion.png?url';
import foundations from '../assets/icons/foundations.png?url';
import glossary from '../assets/icons/glossary.png?url';
import harm from '../assets/icons/harm.png?url';
import hierarchies from '../assets/icons/hierarchies.png?url';
import humanPotential from '../assets/icons/human-potential.png?url';
import introduction from '../assets/icons/introduction.png?url';
import inventory from '../assets/icons/inventory.png?url';
import marksAndTiers from '../assets/icons/marks-and-tiers.png?url';
import omens from '../assets/icons/omens.png?url';
import skills from '../assets/icons/skills.png?url';
import tide from '../assets/icons/tide.png?url';
import traits from '../assets/icons/traits.png?url';

/** slug → resolved asset URL (includes base path when built) */
export const chapterIcons: Record<string, string> = {
	index: introduction,
	introduction,
	'dice-mechanics': diceMechanics,
	'marks-and-tiers': marksAndTiers,
	omens,
	tide,
	glossary,
	'human-potential': humanPotential,
	foundations,
	skills,
	traits,
	exertion,
	harm,
	echoes,
	hierarchies,
	inventory,
	'campaign-setup': campaignSetup,
	'character-creation': characterCreation,
	automation,
};

/** path segment used in sidebar hrefs → slug */
export const hrefSegmentToSlug: Record<string, string> = {
	'': 'index',
	introduction: 'introduction',
	'dice-mechanics': 'dice-mechanics',
	'marks-and-tiers': 'marks-and-tiers',
	omens: 'omens',
	tide: 'tide',
	glossary: 'glossary',
	'human-potential': 'human-potential',
	foundations: 'foundations',
	skills: 'skills',
	traits: 'traits',
	exertion: 'exertion',
	harm: 'harm',
	echoes: 'echoes',
	hierarchies: 'hierarchies',
	inventory: 'inventory',
	'campaign-setup': 'campaign-setup',
	'character-creation': 'character-creation',
	automation: 'automation',
};

/** Sidebar group label — shown as a title kicker only when it adds wayfinding. */
type SectionLabel = { en: string; hu: string };

const sectionDice: SectionLabel = { en: 'Dice Mechanics', hu: 'Kockamechanika' };
const sectionHuman: SectionLabel = { en: 'Human Potential', hu: 'Emberi adottságok' };
const sectionResolution: SectionLabel = {
	en: 'Resolution & Continuity',
	hu: 'Feloldás és folytonosság',
};
const sectionCampaign: SectionLabel = {
	en: 'Campaign & Character Creation',
	hu: 'Kampány és karakteralkotás',
};
const sectionReference: SectionLabel = { en: 'Reference', hu: 'Névtár' };

const chapterKickers: Record<string, SectionLabel | null> = {
	index: null,
	introduction: null,
	'dice-mechanics': null,
	'marks-and-tiers': sectionDice,
	omens: sectionDice,
	tide: sectionDice,
	glossary: sectionReference,
	'human-potential': null,
	foundations: sectionHuman,
	skills: sectionHuman,
	traits: sectionHuman,
	exertion: sectionHuman,
	harm: sectionResolution,
	echoes: sectionResolution,
	hierarchies: sectionResolution,
	inventory: sectionResolution,
	'campaign-setup': sectionCampaign,
	'character-creation': sectionCampaign,
	automation: null,
};

export function chapterKickerFor(slug: string, lang: string): string | null {
	const label = chapterKickers[slug];
	if (!label) return null;
	return lang === 'hu' ? label.hu : label.en;
}

export function slugFromEntryId(id: string): string {
	let slug = String(id)
		.replace(/\\/g, '/')
		.replace(/\/index$/, '')
		.replace(/\.mdx?$/, '')
		.split('/')
		.pop()!;
	if (slug === 'index' || slug === '' || slug === '.') return 'index';
	return slug;
}
