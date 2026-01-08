import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';

interface ScoreDisplayProps {
  note: string; // e.g., "c/4"
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ note }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous rendering
      containerRef.current.innerHTML = '';

      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(200, 200);
      const context = renderer.getContext();

      // Create a stave of width 150 at position 10, 40 on the canvas.
      const stave = new Stave(10, 40, 150);
      stave.addClef('bass');
      stave.setContext(context).draw();

      const [pitch, octave] = note.split('/');
      const staveNote = new StaveNote({
        clef: 'bass',
        keys: [note],
        duration: 'q',
      });

      // Add accidental if needed (e.g., c#/4, eb/3)
      if (pitch.includes('#')) {
        staveNote.addModifier(new Accidental('#'), 0);
      } else if (pitch.length > 1 && pitch.slice(1).includes('b')) {
        staveNote.addModifier(new Accidental('b'), 0);
      }

      const voice = new Voice({ numBeats: 1, beatValue: 4 });
      voice.addTickables([staveNote]);

      new Formatter().joinVoices([voice]).format([voice], 100);
      voice.draw(context, stave);
    }
  }, [note]);

  return <div ref={containerRef} style={{ background: 'white', padding: '10px', borderRadius: '8px' }} />;
};

export default ScoreDisplay;
