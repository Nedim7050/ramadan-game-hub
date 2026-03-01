'use client';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, MoonStar, Trophy } from 'lucide-react';

export default function Navbar() {
    const { user, setUser, setIsAuthLoaded } = useStore();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (user?.id) {
            supabase.from('profiles').select('is_admin').eq('id', user.id).single()
                .then(({ data }) => {
                    setIsAdmin(!!data?.is_admin);
                });
        } else {
            setIsAdmin(false);
        }
    }, [user?.id]);

    useEffect(() => {
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                    if (data) Object.assign(data, { id: data.id });
                    if (data) setUser({ id: data.id, username: data.username, avatar_url: data.avatar_url });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsAuthLoaded(true);
            }
        };
        initSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
                setUser(null);
                setIsAdmin(false);
            }
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <nav className="w-full bg-[#0a0f1e]/80 backdrop-blur-md border-b border-[#cd9a46]/30 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
            <Link href="/" className="flex items-center gap-2 text-[#cd9a46] font-bold text-lg sm:text-xl tracking-wider">
                <MoonStar className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]" />
                <span className="hidden xs:inline">RAMADAN HUB</span>
            </Link>

            <div className="flex gap-4 items-center">
                {user ? (
                    <>
                        {isAdmin && (
                            <>
                                <Link href="/admin" className="text-red-400 hover:text-red-300 font-bold tracking-wider text-xs border border-red-900/50 bg-red-900/20 px-2 py-1 rounded">
                                    ADMIN DASHBOARD
                                </Link>
                                <Link href="/leaderboard" className="text-gray-300 hover:text-[#cd9a46] flex gap-2 items-center transition-colors">
                                    <Trophy size={18} />
                                    <span className="hidden sm:inline">Leaderboard</span>
                                </Link>
                            </>
                        )}
                        <Link href="/profile" className="text-gray-300 hover:text-[#cd9a46] flex gap-2 items-center transition-colors">
                            <UserIcon size={18} />
                            <span className="hidden sm:inline">{user.username}</span>
                        </Link>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 flex gap-2 items-center transition-colors">
                            <LogOut size={18} />
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="px-4 sm:px-6 py-2 rounded-full border border-[#cd9a46] text-[#cd9a46] font-semibold text-xs sm:text-sm hover:bg-[#cd9a46]/10 transition-colors whitespace-nowrap">
                            Player Login
                        </Link>
                        <Link href="/admin/login" className="px-3 sm:px-4 py-2 rounded-full border border-red-900 text-red-500 font-bold text-xs sm:text-sm hover:bg-red-900/20 transition-all hidden sm:flex items-center gap-2">
                            Admin
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
