import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { listBoardMembers } from '../services/operationsService';
import type { TrelloMember } from '../types/operations';

/** Live Trello board members, fetched through the trello-sync proxy - never
 * stored locally. Any authenticated Flowers KNOT user can call this (it's
 * read-only), which is what lets an employee see real assignee names on
 * their own cards without a local team roster. */
export function useTrelloMembers() {
  const { user, profile } = useAuth();
  const [members, setMembers] = useState<TrelloMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user || !profile) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listBoardMembers();
      setMembers(res.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل أعضاء Trello');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useEffect(() => {
    reload();
  }, [reload]);

  function nameFor(trelloMemberId: string): string {
    return members.find((m) => m.id === trelloMemberId)?.fullName ?? trelloMemberId;
  }

  function memberFor(trelloMemberId: string): TrelloMember | undefined {
    return members.find((m) => m.id === trelloMemberId);
  }

  return { members, loading, error, reload, nameFor, memberFor };
}
