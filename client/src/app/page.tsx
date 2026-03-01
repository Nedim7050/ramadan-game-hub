import Link from 'next/link';
import { MoonStar } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] text-center space-y-6 sm:space-y-10 overflow-hidden rounded-[2.5rem] mt-2 sm:mt-6 border border-[#cd9a46]/20 shadow-2xl p-4 sm:p-8">
      {/* Dynamic Background Image Support */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 sm:opacity-30 z-0 transition-opacity duration-1000 pointer-events-none"
        style={{ backgroundImage: "url('/bg.png')" }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#05080f] via-[#05080f]/50 to-transparent z-0 pointer-events-none"></div>

      <div className="p-4 sm:p-6 bg-[#cd9a46]/10 rounded-full z-10 border border-[#cd9a46]/30 shadow-2xl">
        <MoonStar size={60} className="text-[#cd9a46] sm:w-[80px] sm:h-[80px]" />
      </div>

      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 z-10 drop-shadow-2xl leading-tight">
        Ramadan <br className="sm:hidden" /> <span className="text-[#cd9a46] bg-clip-text bg-gradient-to-r from-[#cd9a46] to-yellow-500">Game Hub</span>
      </h1>

      <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl px-2 z-10 drop-shadow-md font-medium leading-relaxed">
        Join your friends for unforgettable nights. Play Tic-Tac-Toe, Quiz, Secret or Dare, and UNO in real-time!
      </p>

      <div className="flex flex-col sm:flex-row gap-4 pt-6 sm:pt-10 w-full max-w-xl mx-auto px-4 justify-center z-10">
        <Link href="/login" className="px-8 py-3 sm:py-4 rounded-full bg-gradient-to-r from-[#cd9a46] to-yellow-600 text-[#05080f] font-bold text-base sm:text-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(205,154,70,0.4)] transition-all flex-1 uppercase tracking-wider flex items-center justify-center">
          Player Login
        </Link>
        <Link href="/signup" className="px-8 py-3 sm:py-4 rounded-full border-2 border-[#cd9a46] bg-[#0a0f1e]/80 text-[#cd9a46] font-bold text-base sm:text-lg hover:bg-[#cd9a46]/10 hover:scale-105 transition-all outline-none flex-1 uppercase tracking-wider flex items-center justify-center">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
