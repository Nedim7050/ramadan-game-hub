"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_points: number;
  wins: number;
  games_played: number;
}

/**
 * Page du tableau de classement global.  Interroge la vue `leaderboard_view`
 * dans Supabase et affiche le top des joueurs avec leurs points, victoires et
 * parties jouées.
 */
export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data, error } = await supabase.from('leaderboard_view').select('*').order('total_points', { ascending: false }).limit(50);
      if (!error && data) {
        setEntries(data as any);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-primary">Leaderboard</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-secondary text-white">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">#</th>
              <th className="px-4 py-2 text-left">Joueur</th>
              <th className="px-4 py-2 text-left">Points</th>
              <th className="px-4 py-2 text-left">Victoires</th>
              <th className="px-4 py-2 text-left">Parties jouées</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, idx) => (
              <tr key={entry.user_id} className={idx % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}>
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{entry.username}</td>
                <td className="px-4 py-2">{entry.total_points}</td>
                <td className="px-4 py-2">{entry.wins}</td>
                <td className="px-4 py-2">{entry.games_played}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}