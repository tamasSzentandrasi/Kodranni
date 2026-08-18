/**
 * Chapter icons via Vite `?url` so `base: '/Kodranni/Guidebook'` is applied correctly.
 */
import automation from '../assets/icons/automation.svg?url';
import campaignSetup from '../assets/icons/campaign-setup.svg?url';
import characterCreation from '../assets/icons/character-creation.svg?url';
import diceMechanics from '../assets/icons/dice-mechanics.svg?url';
import echoes from '../assets/icons/echoes.svg?url';
import exertion from '../assets/icons/exertion.svg?url';
import foundations from '../assets/icons/foundations.svg?url';
import glossary from '../assets/icons/glossary.svg?url';
import harm from '../assets/icons/harm.svg?url';
import hierarchies from '../assets/icons/hierarchies.svg?url';
import humanPotential from '../assets/icons/human-potential.svg?url';
import introduction from '../assets/icons/introduction.svg?url';
import inventory from '../assets/icons/inventory.svg?url';
import marksAndTiers from '../assets/icons/marks-and-tiers.svg?url';
import omens from '../assets/icons/omens.svg?url';
import skills from '../assets/icons/skills.svg?url';
import tide from '../assets/icons/tide.svg?url';
import traits from '../assets/icons/traits.svg?url';

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
