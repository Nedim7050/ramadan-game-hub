'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import BackButton from '@/components/BackButton';

export default function Signup() {
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { setUser } = useStore();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const { data, error } = await supabase.auth.signUp({
            email: username.toLowerCase() + '@ramadan.local',
            password
        });
        if (error) {
            setError(error.message);
            return;
        }

        if (data.user) {
            const { error: profileError } = await supabase.from('profiles').insert([
                { id: data.user.id, username }
            ]);
            if (profileError) {
                setError("Error creating profile: " + profileError.message);
                return;
            }
            setUser({ id: data.user.id, username });
        }
        router.push('/lobby');
    };

    return (
        <div className="max-w-md mx-auto mt-10 sm:mt-20 p-6 sm:p-8 bg-[#0a0f1e]/80 backdrop-blur-md rounded-2xl border border-[#cd9a46]/30 shadow-2xl mx-4 sm:mx-auto">
            <BackButton href="/" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6 text-center tracking-tight">Sign Up</h2>
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}
            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-gray-400 mb-1 text-sm">Pseudo</label>
                    <input type="text" required className="w-full bg-[#05080f] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#cd9a46]" value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div>
                    <label className="block text-gray-400 mb-1 text-sm">Password</label>
                    <input type="password" required className="w-full bg-[#05080f] border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:border-[#cd9a46]" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" className="w-full bg-[#cd9a46] text-[#05080f] font-bold py-2 rounded mt-4 hover:bg-opacity-90 transition-opacity">
                    Create Account
                </button>
            </form>
            <p className="mt-6 text-center text-gray-400 text-sm">
                Already have an account? <Link href="/login" className="text-[#cd9a46] hover:underline">Log in</Link>
            </p>
        </div>
    );
}
