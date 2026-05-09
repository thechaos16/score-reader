// Classic McLeod Pitch Method / Autocorrelation
export function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // not enough signal

  const c = new Float32Array(SIZE).fill(0);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  // Find the first downward slope
  let d = 0; 
  while (d < SIZE - 1 && c[d] > c[d + 1]) d++;
  
  // Find the absolute maximum correlation value
  let maxval = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
    }
  }
  
  // Now find the first prominent peak that is at least 90% of the absolute maximum
  let threshold = maxval * 0.9;
  let maxpos = -1;
  for (let i = d; i < SIZE - 1; i++) {
    if (c[i] > c[i-1] && c[i] >= c[i+1] && c[i] > threshold) {
      maxpos = i;
      break; // Stop at the first prominent peak to avoid harmonics
    }
  }

  if (maxpos === -1) return -1;

  let T0 = maxpos;

  // Parabolic interpolation for better precision
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a !== 0) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}
