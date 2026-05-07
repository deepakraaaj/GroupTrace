import { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAppStore } from '../../stores/appStore';

export function TripPlanner() {
  const activeGroup = useAppStore((s) => s.activeGroup);
  const setActiveTrip = useAppStore((s) => s.setActiveTrip);
  const [name, setName] = useState('');
  const [destName, setDestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!activeGroup) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('trips')
        .insert({
          group_id:         activeGroup.id,
          name:             name || 'Trip',
          destination_name: destName || null,
          status:           'active',
          started_at:       new Date().toISOString(),
        })
        .select()
        .single();

      if (err) throw err;
      setActiveTrip({
        id:              data.id,
        name:            data.name,
        destinationLat:  data.destination_lat,
        destinationLng:  data.destination_lng,
        destinationName: data.destination_name,
        status:          data.status,
        startedAt:       data.started_at,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trip-planner">
      <h3 className="section-title">Set Destination (optional)</h3>
      <form onSubmit={handleStart}>
        <input
          className="text-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Trip name (e.g. Kedarnath Trek Day 1)"
        />
        <input
          className="text-input"
          type="text"
          value={destName}
          onChange={(e) => setDestName(e.target.value)}
          placeholder="Destination name (optional)"
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Starting…' : 'Start Trip'}
        </button>
      </form>
    </div>
  );
}
