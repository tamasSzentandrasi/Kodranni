/**
 * Persistence port (hexagonal). Application code depends on this interface.
 * SQLite (or memory) is an adapter behind it.
 */
import type {
  AuditEvent,
  CharacterRecord,
  CommunityRecord,
  MemberRecord,
  PublicSnapshot,
  RollRecord,
} from './types.js';

export interface CommunityStorePort {
  readonly path: string;
  close(): void;
  getCommunity(): CommunityRecord;
  putCommunity(c: CommunityRecord): void;
  listCharacters(): CharacterRecord[];
  getCharacterBySlug(slug: string): CharacterRecord | undefined;
  getCharacterById(id: string): CharacterRecord | undefined;
  putCharacter(c: CharacterRecord): void;
  listMembers(): MemberRecord[];
  putMember(m: MemberRecord): void;
  appendEvent(event: Omit<AuditEvent, 'id' | 'ts'> & { id?: string; ts?: string }): AuditEvent;
  hasClientEvent(clientEventId: string): boolean;
  insertRoll(roll: RollRecord): void;
  getRoll(id: string): RollRecord | undefined;
  toPublicSnapshot(): PublicSnapshot;
}
