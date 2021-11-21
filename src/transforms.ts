import * as dsp from 'dsp.js';

export const applyDiscreteFourierTransform = (buffer: Float32Array, sampleRate: number): Float64Array => {
  const fft = new dsp.DFT(buffer.length, sampleRate);
  fft.forward(buffer);

  return fft.spectrum;
};

export const multiplySpectrum = (multiplier: number) => (originalSpectrum: Float64Array, numSamples: number) => {
  const transformedSpectrum = new Float64Array(originalSpectrum.length);

  const isEvenNumberOfSamples = numSamples % 2 === 0;

  for (let i = 0; i < transformedSpectrum.length; i++) {
    const isLastItem = i === transformedSpectrum.length - 1;

    if (i === 0 || (isEvenNumberOfSamples && isLastItem)) {
      transformedSpectrum[i] = originalSpectrum[i];
    } else {
      transformedSpectrum[i] = originalSpectrum[i] * multiplier;
    }
  }

  return transformedSpectrum;
};

export const applyHanningWindow = (buffer: Float32Array) => {
  const windowSize = buffer.length;
  const window = hanningWindow(windowSize);

  const bufferWithHanning = new Float32Array(buffer.slice(0));

  for (let i = 0; i < windowSize; i++) {
    bufferWithHanning[i] *= window[i];
  }

  return bufferWithHanning;
};

const hanningWindow = (length: number) => {
  const window = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1));
  }
  return window;
};
