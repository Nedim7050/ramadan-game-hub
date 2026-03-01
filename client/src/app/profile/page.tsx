'use client';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Profile() {
    const { user } = useStore();
    const router = useRouter();

    useEffect(() => {
        if (user === null) router.push('/login');
    }, [user]);

    if (!user) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

    return (
        <div className="max-w-2xl mx-auto mt-10 p-8 bg-[#0a0f1e] rounded-xl border border-[#cd9a46]/30 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6">Mon Profil</h2>
            <div className="space-y-4 text-gray-300">
                <p><strong className="text-[#cd9a46]">ID:</strong> {user.id}</p>
                <p><strong className="text-[#cd9a46]">Nom d'utilisateur:</strong> {user.username}</p>
            </div>
        </div>
    );
}
