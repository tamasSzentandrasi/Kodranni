import {
  makeEcho,
  type CommunityStorePort,
  type EchoRecord,
  type EchoStakeholder,
} from '@kodranni/store';

function titleKey(title: string): string {
  return title.trim().toLowerCase();
}

function slugsOf(group: EchoStakeholder[] | undefined): string[] {
  return (group ?? []).map((g) => g.characterSlug).filter((s): s is string => Boolean(s));
}

function withBearer(group: EchoStakeholder[] | undefined, name: string, slug: string): EchoStakeholder[] {
  const list = [...(group ?? [])];
  if (!list.some((g) => g.characterSlug === slug || g.name.toLowerCase() === name.toLowerCase())) {
    list.unshift({ name, characterSlug: slug });
  }
  return list;
}

function upsertCopy(
  store: CommunityStorePort,
  slug: string,
  echo: EchoRecord,
): void {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) return;
  const key = titleKey(echo.title);
  const rest = (ch.echoes ?? []).filter((e) => titleKey(e.title) !== key);
  ch.echoes = [echo, ...rest];
  store.putCharacter(ch);
}

function removeCopy(store: CommunityStorePort, slug: string, key: string): void {
  const ch = store.getCharacterBySlug(slug);
  if (!ch) return;
  const next = (ch.echoes ?? []).filter((e) => titleKey(e.title) !== key);
  if (next.length === (ch.echoes ?? []).length) return;
  ch.echoes = next;
  store.putCharacter(ch);
}

/** Keep weight-2 group echoes identical on every named sheet. */
export function syncMirroredGroupEchoes(
  store: CommunityStorePort,
  editorSlug: string,
  previous: EchoRecord[],
  next: EchoRecord[],
): void {
  const editor = store.getCharacterBySlug(editorSlug);
  if (!editor) return;

  const prevG = previous.filter((e) => e.weight === 2);
  const nextG = next.filter((e) => e.weight === 2);
  const prevMap = new Map(prevG.map((e) => [titleKey(e.title), e]));
  const nextMap = new Map(nextG.map((e) => [titleKey(e.title), e]));
  const keys = new Set([...prevMap.keys(), ...nextMap.keys()]);

  for (const key of keys) {
    const before = prevMap.get(key);
    const after = nextMap.get(key);
    const oldSlugs = new Set(slugsOf(before?.group));
    oldSlugs.add(editorSlug);
    const newSlugs = new Set(slugsOf(after?.group));
    if (after) newSlugs.add(editorSlug);

    for (const slug of oldSlugs) {
      if (!after || !newSlugs.has(slug)) {
        if (slug !== editorSlug) removeCopy(store, slug, key);
      }
    }
    if (!after) continue;

    const group = withBearer(after.group, editor.name, editorSlug);
    const payload = makeEcho({
      title: after.title,
      weight: 2,
      invokeWhen: after.invokeWhen,
      note: after.note,
      group,
      groupLabel: after.groupLabel,
      resolved: after.resolved,
    });
    for (const slug of newSlugs) {
      if (slug === editorSlug) continue;
      upsertCopy(store, slug, payload);
    }
    const self = store.getCharacterBySlug(editorSlug);
    if (self) {
      self.echoes = (self.echoes ?? []).map((e) => (titleKey(e.title) === key ? { ...payload } : e));
      store.putCharacter(self);
    }
  }
}
