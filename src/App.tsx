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

const TIME_LIMIT = 5;

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | '' }>({
    text: '',
    type: '',
  });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isTimerEnabled, setIsTimerEnabled] = useState(true);
  const [instrument, setInstrument] = useState<Instrument>('cello');

  useEffect(() => {
    if (feedback.text !== '') return;
    if (!isTimerEnabled) return;

    if (timeLeft === 0) {
      setFeedback({ text: "Time's up!", type: 'wrong' });
      const timeoutId = setTimeout(() => {
        setFeedback({ text: '', type: '' });
        pickRandomNote();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, feedback.text, isTimerEnabled]);

  useEffect(() => {
    pickRandomNote();
  }, []);

  const pickRandomNote = () => {
    const randomIndex = Math.floor(Math.random() * BASS_CLEF_NOTES.length);
    setCurrentIndex(randomIndex);
    setInput('');
    setTimeLeft(TIME_LIMIT);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val.length > 0) {
      val = val[0].toUpperCase() + val.slice(1);
    }
    setInput(val);

    const currentNote = BASS_CLEF_NOTES[currentIndex];

    // Check strict equality if length matches expected length
    if (val.length === currentNote.name.length) {
      if (val === currentNote.name) {
        setFeedback({
          text: `Correct! (${currentNote.string} String, Finger ${currentNote.finger})`,
          type: 'correct'
        });
        playNote(currentNote.key, instrument);
        setScore((s) => s + 1);
        setTimeout(() => {
          setFeedback({ text: '', type: '' });
          pickRandomNote();
        }, 1500);
      } else {
        setFeedback({ text: 'Try again!', type: 'wrong' });
        setTimeout(() => {
          setFeedback({ text: '', type: '' });
          setInput('');
        }, 800);
      }
    }
  };

  return (
    <div className="App">
      <h1>Bass Clef Quiz</h1>
      <p>Score: {score}</p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <p style={{ margin: 0 }}>Time Left: {timeLeft}s</p>
        <button
          onClick={() => setIsTimerEnabled(!isTimerEnabled)}
          style={{ padding: '4px 8px', fontSize: '0.9rem', cursor: 'pointer' }}
        >
          {isTimerEnabled ? '⏸ Pause' : '▶ Resume'}
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

      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', alignItems: 'flex-start' }}>
        <ScoreDisplay note={BASS_CLEF_NOTES[currentIndex].key} />
        {instrument === 'cello' ? (
          <CelloFingerboard
            activeString={feedback.type === 'correct' ? BASS_CLEF_NOTES[currentIndex].string : null}
            activeFinger={feedback.type === 'correct' ? BASS_CLEF_NOTES[currentIndex].finger : null}
          />
        ) : (
          <PianoKeyboard
            activeNote={BASS_CLEF_NOTES[currentIndex].key}
            isActive={feedback.type === 'correct'}
          />
        )}
      </div>

      <div className="card">
        <p>Type the pitch name (A-G):</p>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          maxLength={2}
          autoFocus
        />
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