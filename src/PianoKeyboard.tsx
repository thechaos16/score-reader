import React from 'react';

interface PianoKeyboardProps {
    activeNote?: string | null; // e.g., "c/2", "eb/3"
    isActive: boolean;
}

const PianoKeyboard: React.FC<PianoKeyboardProps> = ({ activeNote, isActive }) => {
    // Define range C2 to E4
    // We need to map keys to positions.
    // White keys have constant width. Black keys are offset.

    const whiteKeyWidth = 20;
    const whiteKeyHeight = 100;
    const blackKeyWidth = 12;
    const blackKeyHeight = 60;

    // Generate keys data
    const octaves = [2, 3, 4];
    const notes = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

    let xOffset = 0;

    const whiteKeys: any[] = [];
    const blackKeys: any[] = [];

    // Manual construction for C2 to E4
    // 2nd Octave: C2-B2
    // 3rd Octave: C3-B3
    // 4th Octave: C4-E4

    // Helper to normalize note string for comparison
    // activeNote: "eb/2" -> matches "Eb2" or key ID.
    // Let's store "note/octave" as ID. e.g. "c/2"

    const targetNote = isActive && activeNote ? activeNote.toLowerCase() : null;
    // Handle Accidentals in targetNote: "eb/2" -> "eb/2"
    // Note: Vexflow often uses "eb" or "f#".

    const createKey = (note: string, octave: number, type: 'white' | 'black', x: number) => {
        // Construct ID to match 'activeNote'
        // White: "c/2". Black: "c#/2" or "db/2"?
        // Our note list uses "eb/2", "bb/2", "f#/3", "c#/4".
        // So we need to match those.

        // Standardize black keys to ones used in App (sharp/flat mix)
        // C# / Db -> Let's support both or match specific list.
        // List: eb, bb, f#, c#.

        let ids: string[] = [];
        if (type === 'white') {
            ids = [`${note}/${octave}`];
        } else {
            // Black key mappings based on base white note
            if (note === 'c') ids = [`c#/${octave}`, `db/${octave}`];
            if (note === 'd') ids = [`d#/${octave}`, `eb/${octave}`];
            if (note === 'f') ids = [`f#/${octave}`, `gb/${octave}`];
            if (note === 'g') ids = [`g#/${octave}`, `ab/${octave}`];
            if (note === 'a') ids = [`a#/${octave}`, `bb/${octave}`];
        }

        const isHighlighted = targetNote && ids.includes(targetNote);

        return {
            type,
            x,
            ids,
            isHighlighted
        };
    };

    octaves.forEach(octave => {
        notes.forEach(note => {
            if (octave === 4 && ['f', 'g', 'a', 'b'].includes(note)) return; // Stop at E4

            // White Key
            whiteKeys.push(createKey(note, octave, 'white', xOffset));

            // Black Key check (after C, D, F, G, A)
            if (['c', 'd', 'f', 'g', 'a'].includes(note)) {
                if (octave === 4 && note === 'd') {
                    // D4 -> D#4/Eb4 could exist but our range stops at D4 in list?
                    // List has D4. Next might be Eb4? List stops at D4.
                    // Let's add black key after D4 just in case or for visuals.
                    // But loop condition stops at E4. 
                    // If note is D4, adding D#4 is fine.
                }
                // Calculate black key position
                const bx = xOffset + whiteKeyWidth - (blackKeyWidth / 2);
                blackKeys.push(createKey(note, octave, 'black', bx));
            }

            xOffset += whiteKeyWidth;
        });
    });

    return (
        <div style={{ padding: '10px', background: 'white', borderRadius: '8px' }}>
            <svg width={xOffset} height={whiteKeyHeight}>
                {/* Render White Keys First */}
                {whiteKeys.map((k, i) => (
                    <rect
                        key={`w-${i}`}
                        x={k.x}
                        y={0}
                        width={whiteKeyWidth}
                        height={whiteKeyHeight}
                        fill={k.isHighlighted ? '#FF4500' : 'white'}
                        stroke="black"
                        strokeWidth="1"
                    />
                ))}

                {/* Render Black Keys On Top */}
                {blackKeys.map((k, i) => (
                    <rect
                        key={`b-${i}`}
                        x={k.x}
                        y={0}
                        width={blackKeyWidth}
                        height={blackKeyHeight}
                        fill={k.isHighlighted ? '#FF4500' : 'black'}
                        stroke="black"
                        strokeWidth="1"
                    />
                ))}
            </svg>
        </div>
    );
};

export default PianoKeyboard;
