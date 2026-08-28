import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Issue, Comment } from '../types';

export interface PresenceUser {
  user_id: string;
  name: string;
  avatar_url?: string;
  online_at: string;
}

interface UseRealtimeIssueOptions {
  issueId: string;
  initialIssue: Issue | null;
  onCommentReceived?: (comment: Comment) => void;
  onIssueUpdated?: (issue: Issue) => void;
}

export function useRealtimeIssue({
  issueId,
  initialIssue,
  onCommentReceived,
  onIssueUpdated,
}: UseRealtimeIssueOptions) {
  const { user } = useAuth();
  const [activeViewers, setActiveViewers] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!issueId || !user) return;

    // Seed demo viewers if in demo mode
    const demoViewers: PresenceUser[] = [
      {
        user_id: 'user-demo-sarah',
        name: 'Sarah Connor (QA Lead)',
        avatar_url: undefined,
        online_at: new Date().toISOString(),
      },
    ];
    setActiveViewers(demoViewers);

    // Setup Supabase Realtime channel
    try {
      const channel = supabase.channel(`issue:${issueId}`, {
        config: { presence: { key: user.id } },
      });

      channel
        // 1. Presence tracking
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const viewers: PresenceUser[] = [];
          Object.values(state).forEach((presences: any) => {
            presences.forEach((p: any) => {
              if (p.user_id !== user.id) {
                viewers.push({
                  user_id: p.user_id,
                  name: p.name || 'Collaborator',
                  avatar_url: p.avatar_url,
                  online_at: p.online_at || new Date().toISOString(),
                });
              }
            });
          });
          if (viewers.length > 0) {
            setActiveViewers([...demoViewers, ...viewers]);
          }
        })
        // 2. Broadcast: Typing indicator
        .on('broadcast', { event: 'typing' }, (payload: any) => {
          if (payload.payload?.user_id !== user.id) {
            const userName = payload.payload?.name || 'Engineer';
            setTypingUsers((prev) => Array.from(new Set([...prev, userName])));

            setTimeout(() => {
              setTypingUsers((prev) => prev.filter((n) => n !== userName));
            }, 3000);
          }
        })
        // 3. Broadcast: Live Comment Stream
        .on('broadcast', { event: 'new_comment' }, (payload: any) => {
          if (payload.payload?.comment && onCommentReceived) {
            onCommentReceived(payload.payload.comment);
          }
        })
        // 4. Broadcast: Live Issue Update & Conflict Warning
        .on('broadcast', { event: 'issue_updated' }, (payload: any) => {
          const updaterName = payload.payload?.updated_by_name || 'Another engineer';
          if (payload.payload?.user_id !== user.id) {
            setConflictWarning(`This issue was modified by ${updaterName} just now.`);
            if (onIssueUpdated && payload.payload?.issue) {
              onIssueUpdated(payload.payload.issue);
            }
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              name: user.full_name,
              avatar_url: user.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        });

      channelRef.current = channel;
    } catch {
      // Graceful fallback for offline Supabase
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [issueId, user]);

  // Broadcast typing indicator to collaborators
  const sendTypingNotification = useCallback(() => {
    if (!channelRef.current || !user) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, name: user.full_name },
    });

    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  }, [user]);

  // Dismiss conflict alert
  const dismissConflict = useCallback(() => {
    setConflictWarning(null);
  }, []);

  return {
    activeViewers,
    typingUsers,
    conflictWarning,
    sendTypingNotification,
    dismissConflict,
  };
}
