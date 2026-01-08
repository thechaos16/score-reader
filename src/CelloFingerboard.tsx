import React from 'react';

interface CelloFingerboardProps {
    activeString?: string | null; // 'C', 'G', 'D', 'A'
    activeFinger?: string | null; // '0', '1', '2', '3', '4'
}

const CelloFingerboard: React.FC<CelloFingerboardProps> = ({ activeString, activeFinger }) => {
    // Strings from left to right: C, G, D, A
    const strings = ['C', 'G', 'D', 'A'];
    const stringXPositions = {
        C: 30,
        G: 60,
        D: 90,
        A: 120,
    };

    // Finger Y positions (approximated for First Position visual)
    const fingerYPositions = {
        '0': 20, // Open string (at the nut/top)
        '1': 80,
        '2': 120,
        '3': 160,
        '4': 200,
    };

    // Parse finger: remove "(Open)" text if present
    const parsedFinger = activeFinger ? activeFinger.split(' ')[0] : null;

    return (
        <div style={{ padding: '10px', background: 'white', borderRadius: '8px' }}>
            <svg width="150" height="300" viewBox="0 0 150 300">
                {/* Fingerboard (Nut is at top, widening slightly ideally, but simple rect for now) */}
                <path d="M 20 20 L 130 20 L 135 300 L 15 300 Z" fill="#333" />

                {/* Nut (Top bar) */}
                <rect x="20" y="15" width="110" height="10" fill="#666" />

                {/* Strings */}
                {strings.map((str) => (
                    <line
                        key={str}
                        x1={stringXPositions[str as keyof typeof stringXPositions]}
                        y1={20}
                        x2={stringXPositions[str as keyof typeof stringXPositions]}
                        y2={300}
                        stroke="#999" // Standard string color
                        strokeWidth="2"
                    />
                ))}

                {/* Active Note Highlight */}
                {activeString && parsedFinger && stringXPositions[activeString as keyof typeof stringXPositions] && (
                    <>
                        {/* Highlight the string */}
                        <line
                            x1={stringXPositions[activeString as keyof typeof stringXPositions]}
                            y1={20}
                            x2={stringXPositions[activeString as keyof typeof stringXPositions]}
                            y2={300}
                            stroke="#FFD700" // Gold highlight
                            strokeWidth="4"
                            opacity="0.6"
                        />
                        {/* Draw Dot (only if not open string) */}
                        {parsedFinger !== '0' && (
                            <circle
                                cx={stringXPositions[activeString as keyof typeof stringXPositions]}
                                cy={fingerYPositions[parsedFinger as keyof typeof fingerYPositions] || 20}
                                r={12}
                                fill="#FF4500" // Red dot
                                stroke="white"
                                strokeWidth="2"
                            />
                        )}
                    </>
                )}
            </svg>
        </div>
    );
};

export default CelloFingerboard;
