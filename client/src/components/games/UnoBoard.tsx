'use client';

import { useState, useEffect } from 'react';
import { Player } from '../../../../server/src/games/GameInterface';
import { UnoCard, UnoState, UnoColor } from '../../../../server/src/games/Uno';
import { Clock } from 'lucide-react';

export default function UnoBoard({ state, onAction, userId }: { state: UnoState, onAction: (a: any) => void, userId: string }) {
    const isMyTurn = state.players[state.currentTurnIndex]?.id === userId;
    const myHand = state.hands[userId] || [];
    const topCard = state.discardPile[state.discardPile.length - 1];

    const [selectedColor, setSelectedColor] = useState<UnoColor | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    useEffect(() => {
        if (state.lastActionMsg) {
            setToastMsg(state.lastActionMsg.text);
            const timer = setTimeout(() => setToastMsg(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [state.lastActionMsg?.time]);

    // Provide the original Custom CSS styling
    useEffect(() => {
        require('../../../../uno_reference/cards.css');
        require('../../../../uno_reference/styles.css');
        require('../../../../uno_reference/animations.css');
    }, []);

    const handlePlayCard = (cardId: string) => {
        if (!isMyTurn) return;
        onAction({ type: 'play', cardId });
    };

    const handleDrawCard = () => {
        if (!isMyTurn) return;
        onAction({ type: 'draw' });
    };

    const handleCallUno = () => {
        onAction({ type: 'call_uno' });
    };

    const handleCounterUno = () => {
        onAction({ type: 'call_counter_uno' });
    };

    const pickColor = (color: UnoColor) => {
        setSelectedColor(color);
        onAction({ type: 'select_color', color });
    };

    const renderCard = (card: UnoCard, hideFront: boolean = false) => {
        if (hideFront) {
            return (
                <div className="card black drawCardBackHidden" style={{ display: 'table', position: 'relative', margin: '0 -20px' }}>
                    <span className="inner"><span className="mark" style={{ color: '#c72a18', backgroundColor: '#c72a18', textShadow: 'rgb(199, 42, 24) 1px 1px 1px' }}>_</span></span>
                </div>
            );
        }

        let cssClass = '';
        let innerHtml: React.ReactNode = '';
        let markStyle: any = {};
        let additionalElements: React.ReactNode = null;

        if (card.color === 'Special') {
            cssClass = card.value === 13 ? 'wild black' : 'plus-4 black';
            innerHtml = '_';
            markStyle = { color: 'white', textShadow: 'white 1px 1px 1px' };

            if (card.value === 13) {
                additionalElements = (
                    <div className="circle-container">
                        <div className="quarter top-left"></div>
                        <div className="quarter top-right"></div>
                        <div className="quarter bottom-left"></div>
                        <div className="quarter bottom-right"></div>
                        <span className="inner"></span>
                    </div>
                );
            } else if (card.value === 14) {
                additionalElements = (
                    <>
                        <div className="cardsInInnerPlus4 card-plus4-green green"><span className="inner"></span></div>
                        <div className="cardsInInnerPlus4 card-plus4-blue blue"><span className="inner"></span></div>
                        <div className="cardsInInnerPlus4 card-plus4-red red"><span className="inner"></span></div>
                        <div className="cardsInInnerPlus4 card-plus4-yellow yellow"><span className="inner"></span></div>
                    </>
                );
            }
        } else {
            cssClass = card.color.toLowerCase();
            if (card.value <= 9) {
                cssClass += ` num-${card.value}`;
                innerHtml = `${card.value}`;
            } else if (card.value === 10) {
                // Draw 2
                cssClass += ' draw2';
                innerHtml = '_';
                markStyle = { color: 'white', textShadow: 'white 1px 1px 1px' };
                additionalElements = (
                    <>
                        <div className="cardsInInnerPlus2 card-plus2-bottom-left"><span className="inner"></span></div>
                        <div className="cardsInInnerPlus2 card-plus2-top-right"><span className="inner"></span></div>
                    </>
                );
            } else if (card.value === 11) {
                cssClass += ' reverse';
                innerHtml = '⇄';
            } else if (card.value === 12) {
                cssClass += ' skip';
                innerHtml = '⊘';
            }
        }

        return (
            <div className={`card ${cssClass}`} style={{ display: 'table', position: 'relative', margin: '0 -20px', transition: 'top 0.2s', cursor: 'pointer' }}>
                <span className="inner">
                    <span className="mark" style={markStyle}>{innerHtml}</span>
                    {additionalElements}
                </span>
            </div>
        );
    };

    return (
        <div className="w-full flex-1 flex flex-col relative" style={{ backgroundColor: '#C19A6B', minHeight: '80vh', borderRadius: '1rem', overflow: 'hidden' }}>

            {/* Top Info Bar */}
            <div className="w-full bg-black/60 text-white p-4 flex justify-between items-center z-10 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                <div className="flex gap-4 items-center">
                    <span className="font-bold uppercase tracking-wider text-xl" style={{ color: state.activeColor === 'Special' ? 'white' : state.activeColor.toLowerCase() }}>
                        Color: {state.activeColor === 'Special' ? 'Any' : state.activeColor}
                    </span>
                    {state.drawStackPenalty > 0 && (
                        <div className="bg-red-600 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                            +{state.drawStackPenalty} Stacked!
                        </div>
                    )}
                </div>

                {/* Player Turn Indicator */}
                <div className="flex gap-2">
                    {state.players.map((p, idx) => (
                        <div key={p.id} className={`px-4 py-1 rounded border-2 ${idx === state.currentTurnIndex ? 'border-yellow-400 bg-yellow-400/20 shadow-[0_0_10px_#facc15]' : 'border-transparent opacity-50'}`}>
                            {p.username} {state.hands[p.id]?.length === 1 && <span className="text-red-500 font-bold ml-1">UNO!</span>}
                            <div className="text-xs text-center">{state.hands[p.id]?.length} cards</div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 font-mono text-xl">
                    <Clock size={20} className={state.timeRemaining <= 5 ? "text-red-500 animate-pulse" : "text-gray-300"} />
                    <span className={state.timeRemaining <= 5 ? "text-red-500 font-bold" : "text-gray-300"}>
                        {state.timeRemaining}s
                    </span>
                </div>
            </div>

            {/* Top Notifications */}
            {toastMsg && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-[#cd9a46] text-[#05080f] font-black text-xl sm:text-3xl italic px-8 py-3 rounded-full shadow-[0_0_30px_rgba(205,154,70,0.8)] border-4 border-white animate-bounce whitespace-nowrap text-center">
                    {toastMsg}
                </div>
            )}

            {/* Playfield Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative p-8 gap-8">

                {/* Center Deck & Discard */}
                <div className="flex items-center justify-center gap-16 scale-[0.8] sm:scale-100">

                    {/* Draw Pile */}
                    <div onClick={handleDrawCard} className="relative cursor-pointer hover:-translate-y-2 transition-transform duration-200">
                        <div className="drawDeckOnPlayfield black z-0">
                            <span className="inner"><span className="mark" style={{ color: '#c72a18', backgroundColor: '#c72a18' }}>_</span></span>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center text-white/50 font-bold rotate-45 pointer-events-none text-2xl drop-shadow-md">
                            DRAW
                        </div>
                    </div>

                    {/* Discard Pile */}
                    <div className="relative z-10 scale-125">
                        {renderCard(topCard)}
                    </div>

                </div>

                {/* Call UNO Buttons */}
                <div className="absolute right-[2%] sm:right-[5%] md:right-[10%] top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10 w-[90px] sm:w-[130px] md:w-auto">
                    <button
                        onClick={handleCallUno}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-lg sm:text-2xl md:text-3xl italic py-3 sm:py-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] border-2 sm:border-4 border-yellow-400 transform transition hover:scale-110 active:scale-95"
                    >
                        UNO!
                    </button>
                    <button
                        onClick={handleCounterUno}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] sm:text-sm md:text-xl italic py-2 sm:py-3 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.6)] border-2 sm:border-4 border-white transform transition hover:scale-110 active:scale-95 leading-tight"
                    >
                        CONTRE<br />UNO
                    </button>
                </div>
            </div>

            {/* My Hand */}
            <div className="w-full bg-black/80 p-6 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] pb-12 overflow-x-auto min-h-[220px]">
                <div className="flex justify-center flex-wrap gap-y-4 pr-10">
                    {myHand.map((card) => (
                        <div key={card.id} onClick={() => handlePlayCard(card.id)} className="hover:-translate-y-6 transition-transform cursor-pointer">
                            {renderCard(card)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Color Overlay (Wild Cards) */}
            {
                state.status === 'color_selection' && isMyTurn && (
                    <div id="overlay" style={{ display: 'block', zIndex: 50, backgroundColor: 'rgba(0,0,0,0.8)' }}>
                        <div id="text" className="w-full text-center">
                            <center className="text-4xl font-bold mb-8">Choose a Color Mode!</center>
                            <div className="flex justify-center gap-8 flex-wrap">
                                <div className="w-32 h-32 red-circle cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_#c72a18]" onClick={() => pickColor('Red')}></div>
                                <div className="w-32 h-32 blue-circle cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_#0063b3]" onClick={() => pickColor('Blue')}></div>
                                <div className="w-32 h-32 yellow-circle cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_#e6ca1e]" onClick={() => pickColor('Yellow')}></div>
                                <div className="w-32 h-32 green-circle cursor-pointer hover:scale-110 transition-transform shadow-[0_0_20px_#18a849]" onClick={() => pickColor('Green')}></div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                state.status === 'color_selection' && !isMyTurn && (
                    <div className="absolute inset-0 bg-black/50 z-40 flex items-center justify-center backdrop-blur-sm">
                        <h2 className="text-white text-3xl font-bold animate-pulse shadow-black drop-shadow-lg">
                            {state.players[state.currentTurnIndex]?.username} is choosing a color...
                        </h2>
                    </div>
                )
            }

        </div >
    );
}
