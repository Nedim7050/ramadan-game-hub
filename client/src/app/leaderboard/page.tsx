'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';

export default function Leaderboard() {
    const router = useRouter();
    const { user } = useStore();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [leaders, setLeaders] = useState<any[]>([]);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        supabase.from('profiles').select('is_admin').eq('id', user.id).single()
            .then(({ data }) => {
                if (data?.is_admin) {
                    setIsAdmin(true);
                    supabase.from('leaderboard_view')
                        .select('*')
                        .order('total_points', { ascending: false })
                        .limit(50)
                        .then(({ data }) => {
                            if (data) setLeaders(data);
                        });
                } else {
                    router.push('/lobby');
                }
                setLoading(false);
            });
    }, [user, router]);

    if (loading) return <div className="text-center mt-20 text-gray-400">Verifying privileges...</div>;
    if (!isAdmin) return null;

    return (
        <div className="max-w-4xl mx-auto mt-10">
            <BackButton />
            <div className="flex items-center justify-center gap-4 mb-10">
                <Trophy size={40} className="text-[#cd9a46]" />
                <h2 className="text-4xl font-extrabold text-white tracking-wider">LEADERBOARD</h2>
                <Trophy size={40} className="text-[#cd9a46]" />
            </div>

            <div className="bg-[#0a0f1e]/90 rounded-xl border border-[#cd9a46]/30 overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#05080f] text-[#cd9a46] text-sm uppercase tracking-wider">
                            <th className="py-4 px-6 font-bold">Rank</th>
                            <th className="py-4 px-6 font-bold">Player</th>
                            <th className="py-4 px-6 font-bold text-center">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {leaders.map((p, i) => (
                            <tr key={p.user_id} className="hover:bg-[#cd9a46]/5 transition-colors">
                                <td className="py-4 px-6 font-semibold">
                                    {i === 0 ? <Medal className="text-yellow-400" /> :
                                        i === 1 ? <Medal className="text-gray-300" /> :
                                            i === 2 ? <Medal className="text-amber-600" /> :
                                                <span className="text-gray-500 pl-2">#{i + 1}</span>}
                                </td>
                                <td className="py-4 px-6 text-white font-medium flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs border border-gray-600">
                                        {p.username[0].toUpperCase()}
                                    </div>
                                    {p.username}
                                </td>
                                <td className="py-4 px-6 text-center text-[#cd9a46] font-bold">{p.total_points || 0} pts</td>
                            </tr>
                        ))}
                        {leaders.length === 0 && (
                            <tr><td colSpan={3} className="py-8 text-center text-gray-500">No players found yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
