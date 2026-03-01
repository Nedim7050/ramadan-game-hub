'use client';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Edit2, CheckCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function AdminDashboard() {
    const { user } = useStore();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState<any[]>([]);
    const [gossips, setGossips] = useState<any[]>([]);

    const [editScoreId, setEditScoreId] = useState<string | null>(null);
    const [newScore, setNewScore] = useState<number>(0);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        const checkAdmin = async () => {
            const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
            if (data?.is_admin) {
                setIsAdmin(true);
                loadAdminData();
            } else {
                router.push('/lobby'); // Not admin -> kick to lobby
            }
            setLoading(false);
        };

        checkAdmin();
    }, [user, router]);

    const loadAdminData = async () => {
        try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
            const res = await fetch(`${serverUrl}/api/admin/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminId: user!.id })
            });

            const json = await res.json();
            if (json.success) {
                setUsers(json.users);
                setGossips(json.gossips);
            } else {
                console.error("Admin Load Error:", json.error);
                alert("Failed to load admin data: " + json.error);
            }
        } catch (err: any) {
            console.error("Network Error:", err);
            alert("Network Error connecting to backend: " + err.message);
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm("Warning: Deleting this account will erase all of its Supabase data. Confirm?")) return;
        try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
            const res = await fetch(`${serverUrl}/api/admin/deleteUser`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, adminId: user!.id })
            });
            const json = await res.json();

            if (json.success) loadAdminData();
            else alert("Error from server: " + json.error);
        } catch (err: any) {
            alert("Network Error: " + err.message);
        }
    };

    const deleteGossip = async (gossipId: string) => {
        if (!confirm("Delete this secret message?")) return;
        const { error } = await supabase.from('gossips').delete().eq('id', gossipId);
        if (!error) loadAdminData();
        else alert(error.message);
    };

    const updateScore = async (userId: string) => {
        const currentUser = users.find(u => u.user_id === userId);
        if (!currentUser) return;

        try {
            const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
            const res = await fetch(`${serverUrl}/api/admin/updateScore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newScore, currentScore: currentUser.total_points || 0, adminId: user!.id })
            });

            const json = await res.json();
            if (json.success) loadAdminData();
            else alert(json.error || "Failed to update score.");
        } catch (err: any) {
            alert("Network Error: " + err.message);
        }

        setEditScoreId(null);
    };

    if (loading) return <div className="text-center mt-20 text-gray-400">Verifying Admin privileges...</div>;
    if (!isAdmin) return null;

    return (
        <div className="max-w-6xl mx-auto mt-10 space-y-10">
            <BackButton />
            <div className="flex items-center gap-4 bg-red-900/20 p-6 rounded-xl border border-red-800">
                <ShieldAlert size={40} className="text-red-500" />
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Admin Console</h1>
                    <p className="text-red-400 text-sm">Highly confidential access</p>
                </div>
                <div className="flex max-sm:flex-col gap-3">
                    <Link href="/lobby" className="px-4 py-2 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors shadow flex justify-center">
                        Go to Game Lobby
                    </Link>
                    <Link href="/leaderboard" className="px-4 py-2 bg-gradient-to-r from-[#cd9a46] to-yellow-600 text-[#05080f] font-bold rounded hover:opacity-90 transition-opacity shadow flex justify-center">
                        View Leaderboard
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">

                {/* USERS BOX */}
                <div className="bg-[#0a0f1e] rounded-xl border border-gray-800 p-6 overflow-hidden">
                    <h2 className="text-xl font-bold text-[#cd9a46] mb-4">Player Management</h2>
                    <div className="overflow-y-auto max-h-[500px] pr-2 space-y-3">
                        {users.map(u => (
                            <div key={u.user_id} className="bg-[#05080f] p-4 rounded-lg flex justify-between items-center border border-gray-800">
                                <div>
                                    <div className="font-bold text-white">{u.username}</div>
                                    <div className="text-xs text-gray-500">{u.user_id.substring(0, 8)}...</div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {editScoreId === u.user_id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={newScore}
                                                onChange={e => setNewScore(parseInt(e.target.value))}
                                                className="w-16 bg-gray-900 border border-gray-700 text-white px-2 py-1 rounded"
                                            />
                                            <button onClick={() => updateScore(u.user_id)} className="text-green-500 hover:text-green-400"><CheckCircle size={18} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-500 font-bold">{u.total_points || 0} pts</span>
                                            <button onClick={() => { setEditScoreId(u.user_id); setNewScore(u.total_points || 0); }} className="text-gray-400 hover:text-white"><Edit2 size={16} /></button>
                                        </div>
                                    )}

                                    <button onClick={() => deleteUser(u.user_id)} className="text-red-500 hover:text-red-400 bg-red-900/20 p-2 rounded-full transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GOSSIPS BOX */}
                <div className="bg-[#0a0f1e] rounded-xl border border-gray-800 p-6 overflow-hidden">
                    <h2 className="text-xl font-bold text-[#cd9a46] mb-4">Secret or Dare Secrets 🤐</h2>
                    <div className="overflow-y-auto max-h-[500px] pr-2 space-y-4">
                        {gossips.map(g => (
                            <div key={g.id} className={`p-4 rounded-lg border-l-4 ${g.type === 'dare' ? 'border-red-500 bg-red-900/10' : 'border-[#cd9a46] bg-[#cd9a46]/10'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${g.type === 'dare' ? 'bg-red-500/20 text-red-500' : 'bg-[#cd9a46]/20 text-[#cd9a46]'}`}>
                                        {g.type}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-400 font-medium italic">
                                            100% Anonyme 🕵️
                                        </span>
                                        <button onClick={() => deleteGossip(g.id)} className="text-gray-500 hover:text-red-500 transition-colors" title="Delete message">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-gray-200 mt-2 font-serif italic text-lg leading-relaxed">"{g.message}"</p>
                                <div className="text-[10px] text-gray-600 mt-3 text-right">
                                    {new Date(g.created_at).toLocaleString('fr-FR')}
                                </div>
                            </div>
                        ))}
                        {gossips.length === 0 && <div className="text-gray-500 text-center py-10">No secrets sent yet.</div>}
                    </div>
                </div>

            </div>
        </div>
    );
}
