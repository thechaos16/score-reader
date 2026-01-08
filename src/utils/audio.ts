import * as Tone from 'tone';

export type Instrument = 'cello' | 'piano';

let celloSynth: Tone.FMSynth | null = null;
let pianoSynth: Tone.Synth | null = null;

const getCelloSynth = () => {
    if (!celloSynth) {
        // Create a cello-like sound using FM Synthesis or MonoSynth
        // A "bowed string" often has a complex harmonic structure.
        // FMSynth with specific envelope can approximate strings.
        celloSynth = new Tone.FMSynth({
            harmonicity: 3.01,
            modulationIndex: 14,
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.2, // Bowing in
                decay: 0.3,
                sustain: 0.9,
                release: 1.2 // Resonance
            },
            modulation: {
                type: "square"
            },
            modulationEnvelope: {
                attack: 0.2,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            }
        }).toDestination();

        // Lower volume a bit
        celloSynth.volume.value = -6;
    }
    return celloSynth;
};

const getPianoSynth = () => {
    if (!pianoSynth) {
        pianoSynth = new Tone.Synth({
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.02,
                decay: 0.8,
                sustain: 0.0,
                release: 1.5
            }
        }).toDestination();

        pianoSynth.volume.value = -4;
    }
    return pianoSynth;
};

export const ensureAudioContext = async () => {
    if (Tone.context.state !== 'running') {
        await Tone.start();
    }
};

export const playNote = (vexFlowKey: string, instrument: Instrument = 'cello') => {
    // vexFlowKey format: "key/octave", e.g., "c/2", "eb/3", "f#/3"
    // Tone.js format: "KeyOctave", e.g., "C2", "Eb3", "F#3"

    // Parse
    const [note, octave] = vexFlowKey.split('/');

    // Convert note to UpperCase for first letter (tone.js is flexible but consistency helps)
    // "c" -> "C", "eb" -> "Eb", "f#" -> "F#"
    const pitchName = note.charAt(0).toUpperCase() + note.slice(1);

    const tonJsPitch = `${pitchName}${octave}`;

    ensureAudioContext().then(() => {
        if (instrument === 'cello') {
            const synth = getCelloSynth();
            synth.triggerAttackRelease(tonJsPitch, "2n");
        } else {
            const synth = getPianoSynth();
            synth.triggerAttackRelease(tonJsPitch, "8n");
        }
    });
};
