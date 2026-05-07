import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../stores/appStore';
import { GroupCreator } from '../components/group/GroupCreator';
import type { GroupContext } from '../types';
import { Icon } from '../components/ui/Icon';

export function CreateScreen() {
  const navigate       = useNavigate();
  const user           = useAppStore((s) => s.user);
  const setActiveGroup = useAppStore((s) => s.setActiveGroup);
  const addGroupToList = useAppStore((s) => s.addGroupToList);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleCreate = async (name: string, context: GroupContext) => {
    if (!user) return { shortCode: '' };
    setLoading(true);
    setError('');

    try {
      const { data, error: err } = await supabase.rpc('create_group', {
        p_organizer_id: user.id,
        p_name:         name,
        p_context:      context,
        p_display_name:  user.display_name,
        p_avatar_color:  user.avatar_color,
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
          myRole:       'organizer',
        });

        addGroupToList({
          id:          groupData.id,
          short_code:  groupData.short_code,
          name:        groupData.name,
          context:     groupData.context as GroupContext,
          myRole:      'organizer',
          last_seen_at: new Date().toISOString(),
          is_active:   true,
        });

        setTimeout(() => navigate('/ride-setup'), 2000);
      }

      return { shortCode: row.short_code };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create group';
      setError(msg);
      return { shortCode: '' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen screen--scroll">
      <header className="screen-header" style={{ justifyContent: 'flex-start', padding: '24px 32px' }}>
        <button className="btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <Icon name="arrow-left" size={20} />
          <span>Cancel</span>
        </button>
        <div style={{ marginLeft: 'auto', opacity: 0.5, fontSize: '12px', letterSpacing: '0.1em' }}>NEW MISSION</div>
      </header>
      
      <div className="fade-in" style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '60px' }}>
        <GroupCreator onCreate={handleCreate} loading={loading} error={error} />
      </div>
    </div>
  );
}
