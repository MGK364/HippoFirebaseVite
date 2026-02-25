import { VitalSign } from '../types';

/** Entries can be fully edited or hard-deleted within this window. */
const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export type VitalSignAction = 'edit' | 'delete' | 'void';

/**
 * Returns the set of actions available for a given vital sign record.
 * - Within 30 min of creation: edit + delete
 * - After 30 min: void only
 * - Already voided: no actions
 */
export function getAvailableActions(vs: VitalSign): VitalSignAction[] {
  if (vs.voidedAt) return [];

  const createdAt = vs.createdAt instanceof Date ? vs.createdAt : new Date(vs.createdAt ?? 0);
  const ageMs = Date.now() - createdAt.getTime();

  if (ageMs <= EDIT_WINDOW_MS) {
    return ['edit', 'delete'];
  }
  return ['void'];
}

/** Milliseconds remaining in the edit/delete window. Returns 0 if expired. */
export function getRemainingEditTime(vs: VitalSign): number {
  const createdAt = vs.createdAt instanceof Date ? vs.createdAt : new Date(vs.createdAt ?? 0);
  const ageMs = Date.now() - createdAt.getTime();
  return Math.max(0, EDIT_WINDOW_MS - ageMs);
}

/** Format remaining time as "MM:SS" */
export function formatRemainingTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function isVoided(vs: VitalSign): boolean {
  return vs.voidedAt != null;
}

export function isEdited(vs: VitalSign): boolean {
  return (vs.editHistory?.length ?? 0) > 0;
}
