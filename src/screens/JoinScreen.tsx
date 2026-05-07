import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../stores/appStore';
import { GroupPairing } from '../components/group/GroupPairing';
import type { GroupContext, MemberRole } from '../types';
import { Icon } from '../components/ui/Icon';

export function JoinScreen() {
  const navigate       = useNavigate();
  const user           = useAppStore((s) => s.user);
  const setActiveGroup = useAppStore((s) => s.setActiveGroup);
  const addGroupToList = useAppStore((s) => s.addGroupToList);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleJoin = async (code: string) => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.rpc('join_group_by_code', {
        p_user_id:   user.id,
        p_code:      code,
        p_device_id: null,
        p_display_name: user.display_name,
        p_avatar_color: user.avatar_color,
      });

      if (err) throw err;

      const row = Array.isArray(data) ? data[0] : data;

      const { data: groupData } = await supabase
        .from('groups')
        .select('*')
        .eq('id', row.group_id)
        .single();

      if (groupData) {
        setActiveGroup({
          id:           groupData.id,
          short_code:   groupData.short_code,
          name:         groupData.name,
          context:      groupData.context as GroupContext,
          organizer_id: groupData.organizer_id,
          settings:     groupData.settings,
          myRole:       'member' as MemberRole,
        });

        addGroupToList({
          id:          groupData.id,
          short_code:  groupData.short_code,
          name:        groupData.name,
          context:     groupData.context as GroupContext,
          myRole:      'member',
          last_seen_at: new Date().toISOString(),
          is_active:   true,
        });

        navigate('/ride-setup');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid code or group not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen screen--center screen--scroll">
      <button className="btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Icon name="arrow-left" size={20} />
        <span>Cancel</span>
      </button>

      <div className="fade-in" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <GroupPairing onJoin={handleJoin} loading={loading} error={error} />
      </div>
    </div>
  );
}
