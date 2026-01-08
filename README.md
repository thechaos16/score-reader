# Score Reader: Bass Clef & Cello Fingering Quiz

A specialized interactive web application designed to help students learn bass clef note reading and corresponding first-position cello fingerings.

## Features

*   **Interactive Quiz**: Randomly generates bass clef notes (C2 to D4).
*   **Instrument Modes**:
    *   **Cello Mode**: Visualizes the correct string and finger position on a stylized cello fingerboard.
    *   **Piano Mode**: Visualizes the note on a piano keyboard.
*   **Audio Feedback**: Plays the correct pitch using synthesized Cello or Piano sounds (powered by Tone.js) upon a correct answer.
*   **Timer Challenge**: Optional 5-second timer to test your speed recall.
*   **Enharmonic Support**: Accepts standard note inputs (e.g., "F#", "Eb").

## Tech Stack

*   **Framework**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Music Notation**: [VexFlow](https://github.com/0xfe/vexflow)
*   **Audio Synthesis**: [Tone.js](https://tonejs.github.io/)

## Getting Started

### Prerequisites

*   Node.js (v14 or higher recommended)
*   npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/score-reader.git
    cd score-reader
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Usage

1.  **Start the Quiz**: The app will display a random note on the bass clef.
2.  **Input Answer**: Type the note name (e.g., "C", "F#", "Bb") into the input box.
3.  **Feedback**:
    *   **Correct**: You'll hear the note, see the fingering/key highlighted, and your score will increase.
    *   **Incorrect**: "Try again!" feedback will appear.
4.  **Toggle Settings**:
    *   Use the **Pause/Resume** button to control the timer.
    *   Use the dropdown to switch between **Cello** and **Piano** sounds/visuals.

## License

This project is open source and available under the [MIT License](LICENSE).
