import { useState, useEffect, useRef } from 'react';
import { autoCorrelate } from './utils/pitchDetection';

const STRINGS = [
  { name: 'C String (C2)', freq: 65.41 },
  { name: 'G String (G2)', freq: 98.00 },
  { name: 'D String (D3)', freq: 146.83 },
  { name: 'A String (A3)', freq: 220.00 },
];

export default function CelloTuner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTuning, setIsTuning] = useState(false);
  const [pitch, setPitch] = useState<number>(-1);
  const [noteInfo, setNoteInfo] = useState<{ name: string; cents: number; inTune: boolean } | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      
      const audioCtx = new window.AudioContext();
      audioContextRef.current = audioCtx;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      setIsTuning(true);

      updatePitch();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setHasPermission(false);
    }
  };

  const stopTuner = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsTuning(false);
    setPitch(-1);
    setNoteInfo(null);
  };

  const updatePitch = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(buffer);
    
    const detectedPitch = autoCorrelate(buffer, audioContextRef.current.sampleRate);
    
    if (detectedPitch > -1) {
      setPitch(detectedPitch);
      
      // Find closest string
      let closestString = STRINGS[0];
      let minDiff = Infinity;
      
      for (const s of STRINGS) {
        // Cents calculation: cents = 1200 * Math.log2(freq / targetFreq)
        const cents = 1200 * Math.log2(detectedPitch / s.freq);
        if (Math.abs(cents) < Math.abs(minDiff)) {
          minDiff = cents;
          closestString = s;
        }
      }

      // If we are wildly off all strings (e.g., catching background noise far from a string), we cap the visual
      const cappedCents = Math.max(-50, Math.min(50, minDiff));
      const inTune = Math.abs(minDiff) < 10;
      
      setNoteInfo({
        name: closestString.name,
        cents: cappedCents,
        inTune
      });
    } else {
      setNoteInfo(prev => prev ? { ...prev, inTune: false } : null);
    }

    animationFrameRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return () => {
      stopTuner();
    };
  }, []);

  return (
    <div className="card tuner-card">
      <div className="tuner-header">
        <h2>Cello Tuner</h2>
        {!isTuning ? (
          <button className="tuning-btn" onClick={startTuner}>Start Tuner (Microphone)</button>
        ) : (
          <button className="tuning-btn active" onClick={stopTuner}>Stop Tuner</button>
        )}
      </div>

      {hasPermission === false && (
        <div className="error-msg">Microphone permission denied. Cannot use tuner.</div>
      )}

      {isTuning && (
        <div className="tuner-display">
          <div className="cello-deck">
            <div className={`cello-string string-a ${noteInfo?.name.includes('A') ? 'active' : ''}`} />
            <div className={`cello-string string-d ${noteInfo?.name.includes('D') ? 'active' : ''}`} />
            <div className={`cello-string string-g ${noteInfo?.name.includes('G') ? 'active' : ''}`} />
            <div className={`cello-string string-c ${noteInfo?.name.includes('C') ? 'active' : ''}`} />
          </div>

          <div className="tuner-gauge-container">
            <span className="flat-label">Flat</span>
            <div className="tuner-gauge">
              <div className="gauge-center-line"></div>
              {noteInfo && (
                <div 
                  className={`gauge-needle ${noteInfo.inTune ? 'in-tune' : ''}`}
                  style={{ transform: `rotate(${noteInfo.cents * 0.9}deg)` }}
                />
              )}
            </div>
            <span className="sharp-label">Sharp</span>
          </div>

          <div className="closest-note">
            <h3>{noteInfo ? noteInfo.name : '--'}</h3>
            <div className={`tuning-status ${noteInfo?.inTune ? 'in-tune' : ''}`}>
              {noteInfo 
                ? noteInfo.inTune 
                  ? 'In Tune!' 
                  : (noteInfo.cents < 0 ? 'Too Flat' : 'Too Sharp')
                : 'Listening...'}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
