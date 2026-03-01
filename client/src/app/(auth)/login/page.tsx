'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import BackButton from '@/components/BackButton';

export default function Login() {
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { setUser } = useStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { data, error } = await supabase.auth.signInWithPassword({
            email: pseudo.toLowerCase() + '@ramadan.local',
            password
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
            return;
        }

        if (data.user) {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (profile) {
                setUser({ id: profile.id, username: profile.username, avatar_url: profile.avatar_url });
            }
            router.push('/lobby');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 sm:mt-20 p-6 sm:p-8 bg-[#0a0f1e]/80 backdrop-blur-md rounded-2xl border border-[#cd9a46]/30 shadow-[0_0_30px_rgba(0,0,0,0.5)] mx-4 sm:mx-auto">
            <BackButton href="/" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 sm:mb-8 text-center tracking-tight">Welcome <span className="text-[#cd9a46]">Back</span></h2>
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">⚠️ {error}</div>}

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-gray-300 mb-2 text-sm font-medium">Pseudo</label>
                    <input type="text" required className="w-full bg-[#05080f]/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cd9a46] focus:ring-1 focus:ring-[#cd9a46] transition-all" value={pseudo} onChange={e => setPseudo(e.target.value)} />
                </div>
                <div>
                    <label className="block text-gray-300 mb-2 text-sm font-medium">Password</label>
                    <input type="password" required className="w-full bg-[#05080f]/50 border border-gray-700/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#cd9a46] focus:ring-1 focus:ring-[#cd9a46] transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#cd9a46] to-yellow-600 text-[#05080f] font-bold py-3 rounded-lg mt-6 hover:opacity-90 transition-all shadow-lg shadow-[#cd9a46]/20 text-lg disabled:opacity-50 flex justify-center items-center">
                    {isLoading ? <span className="animate-pulse">Authenticating...</span> : 'Login'}
                </button>
            </form>

            <div className="mt-8 text-center flex flex-col gap-2">
                <p className="text-gray-400 text-sm">
                    Don't have an account? <Link href="/signup" className="text-[#cd9a46] hover:underline font-semibold tracking-wide">Sign up here</Link>
                </p>
                <div className="h-px bg-gray-800 w-full my-2"></div>
                <Link href="/admin/login" className="text-xs text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold">Admin Portal</Link>
            </div>
        </div>
    );
}
