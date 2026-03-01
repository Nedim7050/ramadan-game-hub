'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function BackButton({ className = "", href }: { className?: string; href?: string }) {
    const router = useRouter();

    return (
        <button
            onClick={() => href ? router.push(href) : router.back()}
            className={`flex items-center gap-2 text-gray-400 hover:text-white transition-colors py-2 mb-4 font-semibold text-sm ${className}`}
        >
            <ChevronLeft size={18} />
            Back
        </button>
    );
}
