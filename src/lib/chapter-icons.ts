/**
 * Chapter roses (title frontispiece) and sidebar marks via Vite `?url`
 * so `base: '/Kodranni/Guidebook'` is applied correctly.
 */
import automationIcon from '../assets/icons/automation.png?url';
import campaignSetupIcon from '../assets/icons/campaign-setup.png?url';
import characterCreationIcon from '../assets/icons/character-creation.png?url';
import diceMechanicsIcon from '../assets/icons/dice-mechanics.png?url';
import echoesIcon from '../assets/icons/echoes.png?url';
import exertionIcon from '../assets/icons/exertion.png?url';
import foundationsIcon from '../assets/icons/foundations.png?url';
import glossaryIcon from '../assets/icons/glossary.png?url';
import harmIcon from '../assets/icons/harm.png?url';
import hierarchiesIcon from '../assets/icons/hierarchies.png?url';
import humanPotentialIcon from '../assets/icons/human-potential.png?url';
import introductionIcon from '../assets/icons/introduction.png?url';
import inventoryIcon from '../assets/icons/inventory.png?url';
import marksAndTiersIcon from '../assets/icons/marks-and-tiers.png?url';
import omensIcon from '../assets/icons/omens.png?url';
import skillsIcon from '../assets/icons/skills.png?url';
import tideIcon from '../assets/icons/tide.png?url';
import traitsIcon from '../assets/icons/traits.png?url';

import automationRose from '../assets/roses/automation.jpg?url';
import campaignSetupRose from '../assets/roses/campaign-setup.jpg?url';
import characterCreationRose from '../assets/roses/character-creation.jpg?url';
import diceMechanicsRose from '../assets/roses/dice-mechanics.jpg?url';
import echoesRose from '../assets/roses/echoes.jpg?url';
import exertionRose from '../assets/roses/exertion.jpg?url';
import foundationsRose from '../assets/roses/foundations.jpg?url';
import glossaryRose from '../assets/roses/glossary.jpg?url';
import harmRose from '../assets/roses/harm.jpg?url';
import hierarchiesRose from '../assets/roses/hierarchies.jpg?url';
import humanPotentialRose from '../assets/roses/human-potential.jpg?url';
import introductionRose from '../assets/roses/introduction.jpg?url';
import inventoryRose from '../assets/roses/inventory.jpg?url';
import marksAndTiersRose from '../assets/roses/marks-and-tiers.jpg?url';
import omensRose from '../assets/roses/omens.jpg?url';
import skillsRose from '../assets/roses/skills.jpg?url';
import tideRose from '../assets/roses/tide.jpg?url';
import traitsRose from '../assets/roses/traits.jpg?url';

/** slug → sidebar woodcut (alpha PNG, hue-masked) */
export const chapterIcons: Record<string, string> = {
	index: introductionIcon,
	introduction: introductionIcon,
	'dice-mechanics': diceMechanicsIcon,
	'marks-and-tiers': marksAndTiersIcon,
	omens: omensIcon,
	tide: tideIcon,
	glossary: glossaryIcon,
	'human-potential': humanPotentialIcon,
	foundations: foundationsIcon,
	skills: skillsIcon,
	traits: traitsIcon,
	exertion: exertionIcon,
	harm: harmIcon,
	echoes: echoesIcon,
	hierarchies: hierarchiesIcon,
	inventory: inventoryIcon,
	'campaign-setup': campaignSetupIcon,
	'character-creation': characterCreationIcon,
	automation: automationIcon,
};

/** slug → stained-glass rose (title frontispiece) */
export const chapterRoses: Record<string, string> = {
	index: introductionRose,
	introduction: introductionRose,
	'dice-mechanics': diceMechanicsRose,
	'marks-and-tiers': marksAndTiersRose,
	omens: omensRose,
	tide: tideRose,
	glossary: glossaryRose,
	'human-potential': humanPotentialRose,
	foundations: foundationsRose,
	skills: skillsRose,
	traits: traitsRose,
	exertion: exertionRose,
	harm: harmRose,
	echoes: echoesRose,
	hierarchies: hierarchiesRose,
	inventory: inventoryRose,
	'campaign-setup': campaignSetupRose,
	'character-creation': characterCreationRose,
	automation: automationRose,
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

/** Overview slug for a child chapter — used as a kicker link when one exists. */
const chapterParents: Record<string, string> = {
	'marks-and-tiers': 'dice-mechanics',
	omens: 'dice-mechanics',
	tide: 'dice-mechanics',
	foundations: 'human-potential',
	skills: 'human-potential',
	traits: 'human-potential',
	exertion: 'human-potential',
};

export function chapterKickerFor(slug: string, lang: string): string | null {
	const label = chapterKickers[slug];
	if (!label) return null;
	return lang === 'hu' ? label.hu : label.en;
}

export function chapterParentSlug(slug: string): string | null {
	return chapterParents[slug] ?? null;
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
