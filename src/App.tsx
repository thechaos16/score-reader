import { useState, useEffect } from 'react';
import ScoreDisplay from './ScoreDisplay';
import CelloFingerboard from './CelloFingerboard';
import PianoKeyboard from './PianoKeyboard';
import { playNote, Instrument } from './utils/audio';
import './App.css';

const BASS_CLEF_NOTES = [
  // C String
  { key: 'c/2', name: 'C', string: 'C', finger: '0 (Open)' },
  { key: 'd/2', name: 'D', string: 'C', finger: '1' },
  { key: 'eb/2', name: 'Eb', string: 'C', finger: '2' },
  { key: 'e/2', name: 'E', string: 'C', finger: '3' },
  { key: 'f/2', name: 'F', string: 'C', finger: '4' },
  // G String
  { key: 'g/2', name: 'G', string: 'G', finger: '0 (Open)' },
  { key: 'a/2', name: 'A', string: 'G', finger: '1' },
  { key: 'bb/2', name: 'Bb', string: 'G', finger: '2' },
  { key: 'b/2', name: 'B', string: 'G', finger: '3' },
  { key: 'c/3', name: 'C', string: 'G', finger: '4' },
  // D String
  { key: 'd/3', name: 'D', string: 'D', finger: '0 (Open)' },
  { key: 'e/3', name: 'E', string: 'D', finger: '1' },
  { key: 'f/3', name: 'F', string: 'D', finger: '2' },
  { key: 'f#/3', name: 'F#', string: 'D', finger: '3' },
  { key: 'g/3', name: 'G', string: 'D', finger: '4' },
  // A String
  { key: 'a/3', name: 'A', string: 'A', finger: '0 (Open)' },
  { key: 'b/3', name: 'B', string: 'A', finger: '1' },
  { key: 'c/4', name: 'C', string: 'A', finger: '2' },
  { key: 'c#/4', name: 'C#', string: 'A', finger: '3' },
  { key: 'd/4', name: 'D', string: 'A', finger: '4' },
];


type QuizMode = 'clef-to-note' | 'clef-to-finger' | 'finger-to-note';

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | '' }>({
    text: '',
    type: '',
  });
  const [score, setScore] = useState(0);

  const [instrument, setInstrument] = useState<Instrument>('cello');
  const [quizMode, setQuizMode] = useState<QuizMode>('clef-to-note');



  useEffect(() => {
    pickRandomNote();
  }, []);

  // When mode changes, reset quiz but keep score? Or reset score? Let's reset curr note.
  useEffect(() => {
    pickRandomNote();
    setFeedback({ text: '', type: '' });
    setInput('');
  }, [quizMode]);

  const pickRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * BASS_CLEF_NOTES.length);
    setCurrentIndex(randomIndex);
    setInput('');
    // Play sound on new note
    playNote(BASS_CLEF_NOTES[randomIndex].key, instrument);
  };

  const currentNote = BASS_CLEF_NOTES[currentIndex];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 0) {
      val = val[0].toUpperCase() + val.slice(1);
    }
    setInput(val);

    // Only process text input for modes that require it
    if (quizMode === 'clef-to-finger') return;

    // Check strict equality if length matches expected length
    if (val.length === currentNote.name.length) {
      if (val === currentNote.name) {
        handleCorrect();
      } else {
        handleWrong();
      }
    }
  };

  const handleFingerClick = (string: string, finger: string) => {
    if (quizMode !== 'clef-to-finger') return;
    if (feedback.text !== '') return; // Block input during feedback

    const noteFinger = currentNote.finger.split(' ')[0]; // Handle "0 (Open)" -> "0"

    if (string === currentNote.string && finger === noteFinger) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  const handleCorrect = () => {
    const feedbackText = instrument === 'cello'
      ? `Correct! (${currentNote.string} String, Finger ${currentNote.finger})`
      : 'Correct!';

    setFeedback({
      text: feedbackText,
      type: 'correct'
    });
    playNote(currentNote.key, instrument);
    setScore((s) => s + 1);
    setTimeout(() => {
      setFeedback({ text: '', type: '' });
      pickRandomNote();
    }, 1500);
  };

  const handleWrong = () => {
    setFeedback({ text: 'Try again!', type: 'wrong' });
    setTimeout(() => {
      setFeedback({ text: '', type: '' });
      setInput('');
    }, 800);
  };

  const handlePianoClick = (noteId: string) => {
    if (quizMode !== 'clef-to-finger') return;
    if (feedback.text !== '') return;

    // Helper to check match (including enharmonics)
    const isMatch = (target: string, guess: string) => {
      if (target === guess) return true;
      const map: { [key: string]: string } = {
        'c#': 'db', 'db': 'c#',
        'd#': 'eb', 'eb': 'd#',
        'f#': 'gb', 'gb': 'f#',
        'g#': 'ab', 'ab': 'g#',
        'a#': 'bb', 'bb': 'a#'
      };
      const [tNote, tOct] = target.split('/');
      const [gNote, gOct] = guess.split('/');

      if (tOct !== gOct) return false;
      if (map[tNote] === gNote) return true;

      return false;
    };

    if (isMatch(currentNote.key, noteId)) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  return (
    <div className="App">
      <h1>Bass Clef Quiz</h1>

      {/* Mode Selector */}
      <div style={{ marginBottom: '1rem' }}>
        <label>Mode: </label>
        <select
          value={quizMode}
          onChange={(e) => setQuizMode(e.target.value as QuizMode)}
          style={{ padding: '4px', fontSize: '1rem' }}
        >
          <option value="clef-to-note">Guess Note (Clef & Sound)</option>
          <option value="clef-to-finger">Guess Finger (Clef & Sound)</option>
          <option value="finger-to-note">Guess Note (Finger & Sound)</option>
        </select>
      </div>

      <p>Score: {score}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>

        <button
          onClick={() => playNote(currentNote.key, instrument)}
          style={{ padding: '4px 8px', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          🔊 Replay Sound
        </button>
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value as Instrument)}
          style={{ padding: '4px', fontSize: '0.9rem' }}
        >
          <option value="cello">Cello</option>
          <option value="piano">Piano</option>
        </select>
      </div>

      <div className="game-container">

        {/* Clef Display: Hidden in finger-to-note mode */}
        {quizMode !== 'finger-to-note' && (
          <ScoreDisplay note={currentNote.key} />
        )}

        {/* Instruments: Hidden in clef-to-note mode */}
        {quizMode !== 'clef-to-note' && (
          instrument === 'cello' ? (
            <CelloFingerboard
              // Active String/Finger:
              // Mode 1: Show only on correct
              // Mode 2: Show only on correct (User clicks to guess)
              // Mode 3: Always show (User guesses note based on this)
              activeString={
                quizMode === 'finger-to-note'
                  ? currentNote.string
                  : (feedback.type === 'correct' ? currentNote.string : null)
              }
              activeFinger={
                quizMode === 'finger-to-note'
                  ? currentNote.finger
                  : (feedback.type === 'correct' ? currentNote.finger : null)
              }
              onFingerClick={quizMode === 'clef-to-finger' ? handleFingerClick : undefined}
            />
          ) : (
            <PianoKeyboard
              activeNote={currentNote.key}
              isActive={feedback.type === 'correct' || quizMode === 'finger-to-note'}
              onNoteClick={quizMode === 'clef-to-finger' ? handlePianoClick : undefined}
            />
          )
        )}
      </div>

      {/* Input Section */}
      <div className="card">
        {quizMode === 'clef-to-finger' ? (
          <p>Click the correct position on the Instrument!</p>
        ) : (
          <>
            <p>Type the pitch name (A-G):</p>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              maxLength={2}
              autoFocus
              disabled={feedback.type === 'correct'}
            />
          </>
        )}

        {feedback.text && (
          <div className={`feedback ${feedback.type}`}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;