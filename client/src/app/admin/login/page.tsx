'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';

export default function AdminLogin() {
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const router = useRouter();
    const { setUser } = useStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setStatus('Connecting...');

        const fakeEmail = `${pseudo.trim().toLowerCase()}@ramadan.local`;

        let { error: signInError, data } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });

        if (signInError) {
            setError(signInError.message);
            setStatus('');
            return;
        }

        if (data?.user) {
            setUser({ id: data.user.id, username: pseudo });
            router.push('/admin');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-red-900/10 backdrop-blur-md rounded-2xl border border-red-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 text-red-500/10 pointer-events-none">
                <ShieldAlert size={200} />
            </div>

            <div className="flex flex-col items-center mb-6">
                <ShieldAlert size={40} className="text-red-500 mb-2" />
                <h2 className="text-3xl font-extrabold text-white text-center tracking-tight">Admin Portal</h2>
                <p className="text-red-400 text-sm mt-1 uppercase tracking-widest font-bold">Restricted Access</p>
            </div>

            {error && <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mb-4 text-sm break-words">{error}</div>}
            {status && <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-500 p-3 rounded-lg mb-4 text-sm font-bold">{status}</div>}

            <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                <div>
                    <label className="block text-gray-400 mb-1 text-sm font-bold">Administrator Pseudo</label>
                    <input type="text" required className="w-full bg-[#05080f]/50 border border-red-900/50 rounded-lg px-4 py-3 text-red-50 focus:outline-none focus:border-red-500 transition-colors" value={pseudo} onChange={e => setPseudo(e.target.value)} />
                </div>
                <div>
                    <label className="block text-gray-400 mb-1 text-sm font-bold">Password</label>
                    <input type="password" required className="w-full bg-[#05080f]/50 border border-red-900/50 rounded-lg px-4 py-3 text-red-50 focus:outline-none focus:border-red-500 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-red-700 to-red-600 text-white font-bold py-3 rounded-lg mt-6 hover:opacity-90 transition-all shadow-lg shadow-red-600/20 uppercase tracking-wider">
                    Access Dashboard
                </button>
            </form>

            <div className="mt-6 text-center text-sm">
                <Link href="/login" className="text-gray-500 hover:text-gray-300 transition-colors">← Back to Player Login</Link>
            </div>
        </div>
    );
}
