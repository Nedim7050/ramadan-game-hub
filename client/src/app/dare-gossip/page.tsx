'use client';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquareWarning, ShieldAlert, Send } from 'lucide-react';
import BackButton from '@/components/BackButton';

export default function DareGossip() {
    const { user } = useStore();
    const router = useRouter();

    const [type, setType] = useState<'dare' | 'gossip'>('gossip');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (user === null) router.push('/login');
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !user) return;

        setStatus('loading');
        const { error } = await supabase.from('gossips').insert([
            { author_id: user.id, type, message }
        ]);

        if (error) {
            console.error(error);
            setStatus('error');
        } else {
            setStatus('success');
            setMessage('');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 bg-[#0a0f1e]/90 rounded-2xl border border-[#cd9a46]/30 shadow-2xl relative overflow-hidden">
            <BackButton />

            {/* Decal Background */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <ShieldAlert size={200} />
            </div>

            <div className="flex items-center gap-4 mb-8">
                <MessageSquareWarning size={40} className="text-[#cd9a46]" />
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-wider">Secret or Dare</h2>
                    <p className="text-gray-400 text-sm">Send an anonymous message 👀</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 space-y-6">

                {/* Toggle Type */}
                <div className="flex p-1 bg-[#05080f] rounded-lg border border-gray-800">
                    <button
                        type="button"
                        onClick={() => setType('gossip')}
                        className={`flex-1 py-3 text-center rounded-md font-bold transition-all ${type === 'gossip' ? 'bg-[#cd9a46] text-[#05080f] shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        🤝 Secret
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('dare')}
                        className={`flex-1 py-3 text-center rounded-md font-bold transition-all ${type === 'dare' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        🔥 Dare
                    </button>
                </div>

                {/* Text Area */}
                <div>
                    <label className="block text-gray-400 mb-2 font-semibold">Your anonymous message:</label>
                    <textarea
                        required
                        rows={5}
                        placeholder={type === 'gossip' ? "I confess that..." : "I dare you to..."}
                        className="w-full bg-[#05080f] border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-[#cd9a46] resize-none"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                    />
                </div>

                {status === 'success' && <div className="text-green-500 bg-green-900/20 p-3 rounded font-bold text-center border border-green-800">Message sent incognito 🕵️</div>}
                {status === 'error' && <div className="text-red-500 bg-red-900/20 p-3 rounded font-bold text-center border border-red-800">Error sending message.</div>}

                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-[#cd9a46] text-[#05080f] font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:opacity-90 transition-all text-lg"
                >
                    {status === 'loading' ? 'Sending...' : <><Send size={20} /> Send Secretly</>}
                </button>

            </form>
        </div>
    );
}
