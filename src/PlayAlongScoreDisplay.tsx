import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

interface PlayAlongScoreDisplayProps {
  notes: string[]; // e.g., ["d/3", "f#/3", "a/3"]
  currentNoteIndex: number;
}

const PlayAlongScoreDisplay: React.FC<PlayAlongScoreDisplayProps> = ({ notes, currentNoteIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && notes.length > 0) {
      // Clear previous rendering
      containerRef.current.innerHTML = '';

      const notesCount = notes.length;
      // 70px per note + 100px padding/clef
      const staveWidth = Math.max(300, notesCount * 65 + 100);
      const height = 150;

      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(staveWidth, height);
      const context = renderer.getContext();

      // Create a stave that spans the calculated width
      const stave = new Stave(10, 20, staveWidth - 20);
      stave.addClef('bass');
      stave.setContext(context).draw();

      const staveNotes = notes.map((noteKey, index) => {
        const [pitch] = noteKey.split('/');
        const staveNote = new StaveNote({
          clef: 'bass',
          keys: [noteKey],
          duration: 'q',
        });

        // Add accidental if needed (e.g., f#/3, eb/2)
        if (pitch.includes('#')) {
          staveNote.addModifier(new Accidental('#'), 0);
        } else if (pitch.length > 1 && pitch.slice(1).includes('b')) {
          staveNote.addModifier(new Accidental('b'), 0);
        }

        // Color coding for visual feedback:
        // - Green / Gray: Notes already played correctly
        // - Bright Glowing Blue/Cyan: The current note to play
        // - Neutral Dark/Slate: Future notes
        if (index === currentNoteIndex) {
          staveNote.setStyle({ 
            fillStyle: '#2196f3', 
            strokeStyle: '#2196f3',
            shadowBlur: 10,
            shadowColor: '#2196f3'
          } as any);
        } else if (index < currentNoteIndex) {
          staveNote.setStyle({ 
            fillStyle: '#a5d6a7', // soft green
            strokeStyle: '#a5d6a7' 
          });
        } else {
          staveNote.setStyle({ 
            fillStyle: '#7f8c8d', 
            strokeStyle: '#7f8c8d' 
          });
        }

        return staveNote;
      });

      const voice = new Voice({ numBeats: notesCount, beatValue: 4 });
      voice.addTickables(staveNotes);

      new Formatter().joinVoices([voice]).format([voice], staveWidth - 120);
      voice.draw(context, stave);
    }
  }, [notes, currentNoteIndex]);

  return (
    <div 
      className="play-along-score"
      style={{ 
        width: '100%', 
        overflowX: 'auto', 
        background: '#ffffff', 
        padding: '15px 10px', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'center',
        boxSizing: 'border-box'
      }}
    >
      <div ref={containerRef} style={{ minWidth: 'min-content' }} />
    </div>
  );
};

export default PlayAlongScoreDisplay;
