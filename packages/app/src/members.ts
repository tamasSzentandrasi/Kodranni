import type {
  CharacterRecord,
  CommunityStorePort,
  MemberRecord,
} from '@kodranni/store';

export function resolveCharacterByAccount(
  store: CommunityStorePort,
  platform: string,
  accountId: string,
): CharacterRecord | undefined {
  const members = store.listMembers();
  const m = members.find(
    (x) => x.platform === platform && x.accountId === accountId && x.characterId,
  );
  if (m?.characterId) {
    const byId = store.getCharacterById(m.characterId);
    if (byId) return byId;
  }
  return store.listCharacters().find(
    (c) => c.player?.platform === platform && c.player?.accountId === accountId,
  );
}

export function resolveRoleByAccount(
  store: CommunityStorePort,
  platform: string,
  accountId: string,
): MemberRecord['role'] | undefined {
  const m = store.listMembers().find(
    (x) => x.platform === platform && x.accountId === accountId,
  );
  return m?.role;
}

export interface MapMemberCommand {
  platform: 'discord' | 'fluxer';
  accountId: string;
  characterSlug: string;
  role?: 'player' | 'storyteller';
  displayName?: string;
  actor?: string;
}

export function mapMember(store: CommunityStorePort, cmd: MapMemberCommand): MemberRecord {
  const ch = store.getCharacterBySlug(cmd.characterSlug);
  if (!ch) throw new Error(`unknown character: ${cmd.characterSlug}`);
  const member: MemberRecord = {
    platform: cmd.platform,
    accountId: cmd.accountId,
    characterId: ch.id,
    role: cmd.role ?? 'player',
    displayName: cmd.displayName,
  };
  store.putMember(member);
  // Keep character.player display in sync for sheet
  if (cmd.role !== 'storyteller' || !ch.player) {
    ch.player = {
      platform: cmd.platform,
      accountId: cmd.accountId,
      displayName: cmd.displayName ?? ch.player?.displayName ?? cmd.accountId,
    };
    store.putCharacter(ch);
  }
  store.appendEvent({
    type: 'MemberMapped',
    actor: cmd.actor,
    payload: {
      platform: cmd.platform,
      accountId: cmd.accountId,
      characterSlug: ch.slug,
      role: member.role,
    },
  });
  return member;
}
