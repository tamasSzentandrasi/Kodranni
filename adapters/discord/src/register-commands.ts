/**
 * Register official-app slash commands (CI / operator).
 * Needs DISCORD_BOT_TOKEN + DISCORD_APP_ID. Optional DISCORD_GUILD_ID for instant guild scope.
 */
import { REST, Routes } from 'discord.js';
import { SLASH } from './commands.js';

const token = process.env.DISCORD_BOT_TOKEN?.trim();
const appId = process.env.DISCORD_APP_ID?.trim();
const guildId = process.env.DISCORD_GUILD_ID?.trim();

if (!token || !appId) {
  console.log('skip: DISCORD_BOT_TOKEN / DISCORD_APP_ID unset');
  process.exit(0);
}

const rest = new REST({ version: '10' }).setToken(token);
if (guildId) {
  await rest.put(Routes.applicationGuildCommands(appId, guildId), { body: SLASH });
  console.log(`registered ${SLASH.length} guild commands`);
} else {
  await rest.put(Routes.applicationCommands(appId), { body: SLASH });
  console.log(`registered ${SLASH.length} global commands`);
}
