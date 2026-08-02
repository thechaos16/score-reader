import React, { useState, useEffect, useRef } from 'react';
import { autoCorrelate, frequencyToNote } from './utils/pitchDetection';
import PlayAlongScoreDisplay from './PlayAlongScoreDisplay';
import { playNote } from './utils/audio';
import * as Tone from 'tone';

interface Song {
  title: string;
  notes: string[]; // key format: e.g. ["d/3", "f#/3"]
  displayNames: string[]; // display format: e.g. ["D3", "F#3"]
}

const SONGS: Song[] = [
  {
    title: "C Major Scale (1 Octave)",
    notes: ["c/3", "d/3", "e/3", "f/3", "g/3", "a/3", "b/3", "c/4"],
    displayNames: ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"]
  },
  {
    title: "Ode to Joy (Theme in D)",
    notes: ["f#/3", "f#/3", "g/3", "a/3", "a/3", "g/3", "f#/3", "e/3", "d/3", "d/3", "e/3", "f#/3", "f#/3", "e/3", "e/3"],
    displayNames: ["F#3", "F#3", "G3", "A3", "A3", "G3", "F#3", "E3", "D3", "D3", "E3", "F#3", "F#3", "E3", "E3"]
  },
  {
    title: "Twinkle Twinkle (Theme in D)",
    notes: ["d/3", "d/3", "a/3", "a/3", "b/3", "b/3", "a/3", "g/3", "g/3", "f#/3", "f#/3", "e/3", "e/3", "d/3"],
    displayNames: ["D3", "D3", "A3", "A3", "B3", "B3", "A3", "G3", "G3", "F#3", "F#3", "E3", "E3", "D3"]
  }
];

export default function LivePlayAlong() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songIndex, setSongIndex] = useState(0);
  const [currentNoteIdx, setCurrentNoteIdx] = useState(0);
  const [detectedPitch, setDetectedPitch] = useState<number>(-1);
  const [detectedNote, setDetectedNote] = useState<string>('--');
  const [centsOffset, setCentsOffset] = useState<number>(0);
  const [stabilityProgress, setStabilityProgress] = useState(0); // 0 to 100%
  const [isCompleted, setIsCompleted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pitchHistoryRef = useRef<number[]>([]);
  const stableCountRef = useRef<number>(0);

  const activeSong = SONGS[songIndex];
  const STABILITY_REQUIRED_FRAMES = 6; // ~120ms at 50fps

  const isNoteMatch = (detectedKey: string, targetKey: string) => {
    const cleanD = detectedKey.trim().toLowerCase();
    const cleanT = targetKey.trim().toLowerCase();
    if (cleanD === cleanT) return true;

    // Enharmonics Map
    const enharmonics: { [key: string]: string } = {
      "c#/2": "db/2", "db/2": "c#/2",
      "d#/2": "eb/2", "eb/2": "d#/2",
      "f#/2": "gb/2", "gb/2": "f#/2",
      "g#/2": "ab/2", "ab/2": "g#/2",
      "a#/2": "bb/2", "bb/2": "a#/2",
      
      "c#/3": "db/3", "db/3": "c#/3",
      "d#/3": "eb/3", "eb/3": "d#/3",
      "f#/3": "gb/3", "gb/3": "f#/3",
      "g#/3": "ab/3", "ab/3": "g#/3",
      "a#/3": "bb/3", "bb/3": "a#/3",
      
      "c#/4": "db/4", "db/4": "c#/4",
      "d#/4": "eb/4", "eb/4": "d#/4",
      "f#/4": "gb/4", "gb/4": "f#/4",
      "g#/4": "ab/4", "ab/4": "g#/4",
      "a#/4": "bb/4", "bb/4": "a#/4",
    };

    return enharmonics[cleanD] === cleanT;
  };

  const startPlayAlong = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      setHasPermission(true);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsPlaying(true);
      setIsCompleted(false);
      setCurrentNoteIdx(0);
      stableCountRef.current = 0;
      setStabilityProgress(0);

      // Start Tone context in case confirmation sounds are played
      await Tone.start();

      updateAudioLoop();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setHasPermission(false);
    }
  };

  const stopPlayAlong = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsPlaying(false);
    setDetectedPitch(-1);
    setDetectedNote('--');
    setStabilityProgress(0);
  };

  const playCompletionSound = () => {
    const synth = new Tone.PolySynth().toDestination();
    synth.volume.value = -8;
    const now = Tone.now();
    // Pleasing ascending arpeggio in D major
    synth.triggerAttackRelease("D3", "8n", now);
    synth.triggerAttackRelease("F#3", "8n", now + 0.15);
    synth.triggerAttackRelease("A3", "8n", now + 0.3);
    synth.triggerAttackRelease("D4", "2n", now + 0.45);
  };

  const updateAudioLoop = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);

    // Draw visualizer
    drawOscilloscope(buffer);

    const pitchHz = autoCorrelate(buffer, audioContextRef.current.sampleRate);

    if (pitchHz > -1) {
      // Stabilize pitch using sliding window median
      const history = pitchHistoryRef.current;
      history.push(pitchHz);
      if (history.length > 5) {
        history.shift();
      }
      const sortedHistory = [...history].sort((a, b) => a - b);
      const medianPitch = sortedHistory[Math.floor(sortedHistory.length / 2)];

      setDetectedPitch(medianPitch);

      const parsedNote = frequencyToNote(medianPitch);
      if (parsedNote) {
        setDetectedNote(parsedNote.name + (parsedNote.key.split('/')[1] || ''));
        setCentsOffset(parsedNote.cents);

        // Check if it matches the current expected note of the song
        const expectedNoteKey = activeSong.notes[currentNoteIdx];
        
        if (isNoteMatch(parsedNote.key, expectedNoteKey)) {
          stableCountRef.current += 1;
          const progressPercent = Math.min(100, (stableCountRef.current / STABILITY_REQUIRED_FRAMES) * 100);
          setStabilityProgress(progressPercent);

          if (stableCountRef.current >= STABILITY_REQUIRED_FRAMES) {
            // Note matched stably! Play audio feedback and advance
            playNote(expectedNoteKey, 'cello');
            
            stableCountRef.current = 0;
            setStabilityProgress(0);

            if (currentNoteIdx === activeSong.notes.length - 1) {
              // Song complete!
              setIsCompleted(true);
              stopPlayAlong();
              playCompletionSound();
            } else {
              setCurrentNoteIdx(prev => prev + 1);
            }
          }
        } else {
          // Reset stability tracker if pitch fluctuates
          stableCountRef.current = Math.max(0, stableCountRef.current - 1);
          setStabilityProgress((stableCountRef.current / STABILITY_REQUIRED_FRAMES) * 100);
        }
      }
    } else {
      // Reset history on silence
      pitchHistoryRef.current = [];
      stableCountRef.current = Math.max(0, stableCountRef.current - 1);
      setStabilityProgress((stableCountRef.current / STABILITY_REQUIRED_FRAMES) * 100);
    }

    animationFrameRef.current = requestAnimationFrame(updateAudioLoop);
  };

  const drawOscilloscope = (dataArray: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Grid design
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSpacing = 20;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Midline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Waveform line
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#00f2fe';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00f2fe';
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i];
      const y = (v + 1) * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    return () => {
      stopPlayAlong();
    };
  }, []);

  const handleSongChange = (idx: number) => {
    stopPlayAlong();
    setSongIndex(idx);
    setCurrentNoteIdx(0);
    setIsCompleted(false);
  };

  const progressPercent = Math.round((currentNoteIdx / activeSong.notes.length) * 100);

  return (
    <div className="card play-along-card">
      <div className="play-along-header">
        <h2>Live Play Along Mode</h2>
        <div className="controls-group">
          <select 
            value={songIndex}
            onChange={(e) => handleSongChange(Number(e.target.value))}
            disabled={isPlaying}
            className="song-selector"
          >
            {SONGS.map((song, i) => (
              <option key={song.title} value={i}>{song.title}</option>
            ))}
          </select>
          
          {!isPlaying ? (
            <button className="tuning-btn start-play-btn" onClick={startPlayAlong}>
              Start Listening (Microphone)
            </button>
          ) : (
            <button className="tuning-btn stop-play-btn active" onClick={stopPlayAlong}>
              Stop Mode
            </button>
          )}
        </div>
      </div>

      {hasPermission === false && (
        <div className="error-msg">Microphone permission denied. Cannot use Play Along mode.</div>
      )}

      {/* Main Score Board */}
      <div className="score-board-container">
        <PlayAlongScoreDisplay 
          notes={activeSong.notes} 
          currentNoteIndex={isCompleted ? -1 : currentNoteIdx} 
        />
      </div>

      {/* Progress & Feedback Dashboard */}
      <div className="play-along-dashboard">
        
        {/* Visualizer Canvas */}
        <div className="visualizer-container">
          <canvas 
            ref={canvasRef} 
            width={320} 
            height={120} 
            className="oscilloscope-canvas"
          />
          <div className="canvas-label">Live Cello Signal</div>
        </div>

        {/* Real-time Feedback panel */}
        <div className="feedback-panel">
          <div className="metric-row">
            <span className="metric-label">Target Note:</span>
            <span className="metric-value target-glow">
              {isCompleted ? 'Done!' : activeSong.displayNames[currentNoteIdx]}
            </span>
          </div>

          <div className="metric-row">
            <span className="metric-label">Detected Pitch:</span>
            <span className="metric-value detected-glow">
              {detectedPitch > 0 ? `${detectedNote}` : '--'}
            </span>
          </div>

          <div className="metric-row font-sm">
            <span className="metric-label">Frequency:</span>
            <span>{detectedPitch > 0 ? `${detectedPitch.toFixed(1)} Hz` : '--'}</span>
          </div>

          {/* Stability Matching Gauge */}
          <div className="stability-gauge-container">
            <span className="stability-label">Hold Accuracy:</span>
            <div className="stability-bar-bg">
              <div 
                className="stability-bar-fill" 
                style={{ width: `${stabilityProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar of whole song */}
      <div className="song-progress-container">
        <div className="progress-labels">
          <span>Melody Progress</span>
          <span>{isCompleted ? 100 : progressPercent}%</span>
        </div>
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          />
        </div>
      </div>

      {/* Success Modal/Screen */}
      {isCompleted && (
        <div className="completion-banner">
          <div className="completion-icon">🏆</div>
          <h3>Melody Completed!</h3>
          <p>Beautiful playing! You successfully matched all {activeSong.notes.length} notes.</p>
          <button 
            className="tuning-btn restart-btn" 
            onClick={() => {
              setIsCompleted(false);
              setCurrentNoteIdx(0);
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
