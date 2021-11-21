import {useState, useMemo, useCallback, ChangeEvent} from 'react';
import {WaveChart} from './WaveChart';
import {SpectrumChart} from './SpectrumChart';
import {applyDiscreteFourierTransform, applyHanningWindow, multiplySpectrum} from './transforms';
import './App.css';

const onNumberInputChange = (setter: (value: number) => void) => (e: ChangeEvent<HTMLInputElement>) =>
  setter(parseInt(e.target.value) || 0);

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [transformDuration, setTransformDuration] = useState(20);

  const bufferStartIndex = useMemo(() => {
    if (audioBuffer) {
      return Math.floor((startTime / 1000) * audioBuffer.sampleRate);
    }

    return 0;
  }, [audioBuffer, startTime]);

  const bufferEndIndex = useMemo(() => {
    if (audioBuffer) {
      return Math.floor(((startTime + transformDuration) / 1000) * audioBuffer.sampleRate);
    }

    return 0;
  }, [audioBuffer, startTime, transformDuration]);

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const {files} = event.target;
    if (files?.length) {
      const [file] = files;

      setSelectedFile(file);

      setAudioBuffer(null);

      loadFile(file);
    }
  }, []);

  const loadFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const decodedData = await audioContext.decodeAudioData(buffer);

    setAudioBuffer(decodedData);
  };

  const channelBuffers = useMemo(() => {
    if (!audioBuffer) {
      return [];
    }

    const buffers: Float32Array[] = [];

    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      buffers[i] = audioBuffer.getChannelData(i);
    }

    return buffers;
  }, [audioBuffer]);

  const transformChannelBuffers = useMemo(() => {
    return channelBuffers.map((buffer) => buffer.slice(bufferStartIndex, bufferEndIndex));
  }, [channelBuffers, bufferStartIndex, bufferEndIndex]);

  const spectrums = useMemo(() => {
    if (!audioBuffer) {
      return [];
    }

    const transformedSpectrums: Float64Array[] = [];

    for (let i = 0; i < transformChannelBuffers.length; i++) {
      const buffer = new Float32Array(transformChannelBuffers[i].slice(0, transformChannelBuffers[i].length)); // Slice makes a copy
      const bufferWithHanning = applyHanningWindow(buffer);

      const transformedSpectrum = multiplySpectrum(2)(
        applyDiscreteFourierTransform(bufferWithHanning, audioBuffer.sampleRate),
        bufferWithHanning.length,
      );

      transformedSpectrums.push(transformedSpectrum);
    }

    return transformedSpectrums;
  }, [audioBuffer, transformChannelBuffers]);

  return (
    <div className="App">
      <h1>Dažninė garso signalų analizė</h1>
      <div>
        <input type="file" onChange={onFileChange} />
      </div>
      <div>
        {selectedFile ? <h3>Failo "{selectedFile.name}" analizė</h3> : null}
        {audioBuffer ? (
          <div>
            <p>
              Trukmė - {audioBuffer.duration.toFixed(2)}s (signalo ilgis - {audioBuffer.length})
            </p>
            <p>Dažnis - {audioBuffer.sampleRate}Hz</p>
            <p>Kanalų kiekis - {audioBuffer.numberOfChannels}</p>
            <div>
              <h2>Spektro analizė</h2>
              <div>
                <label htmlFor="start-time">Pradžios laikas (ms):</label>
                <input
                  id="start-time"
                  type="number"
                  min={0}
                  max={audioBuffer.duration * 1000}
                  placeholder="Pradžios laikas"
                  value={startTime}
                  onChange={onNumberInputChange(setStartTime)}
                />
              </div>
              <div>
                <label htmlFor="transform-duration">Atkarpos trukmė (ms):</label>
                <input
                  id="transform-duration"
                  type="number"
                  min={15}
                  max={30}
                  placeholder="Atkarpos trukmė"
                  value={transformDuration}
                  onChange={onNumberInputChange(setTransformDuration)}
                />
              </div>
            </div>
            {channelBuffers.map((channelBuffer, channelIndex) => (
              <WaveChart
                key={channelIndex}
                title={`Amplitudė: kanalas ${channelIndex}`}
                buffer={channelBuffer}
                sampleRate={audioBuffer.sampleRate}
              />
            ))}
            {transformChannelBuffers.map((channelBuffer, channelIndex) => (
              <WaveChart
                key={channelIndex}
                title={`Amplitudė: kanalas ${channelIndex} (trumpalaikė atkarpa)`}
                buffer={channelBuffer}
                sampleRate={audioBuffer.sampleRate}
                startTime={startTime / 1000}
              />
            ))}
            {spectrums.map((channelSpectrum, channelIndex) => (
              <SpectrumChart
                key={channelIndex}
                title={`Spektras: kanalas ${channelIndex}`}
                buffer={channelSpectrum}
                sampleRate={audioBuffer.sampleRate}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
