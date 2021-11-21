import React, {useMemo} from 'react';
import CanvasJSReact from './canvasjs/canvasjs.react';
import {DataPoint} from './canvasjs/types';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

interface SpectrumChartProps {
  title: string;
  buffer: Float64Array;
  sampleRate: number;
}

export const SpectrumChart: React.FC<SpectrumChartProps> = React.memo(({title, buffer, sampleRate}) => {
  const options = useMemo(
    () => ({
      zoomEnabled: true,
      animationEnabled: true,
      title: {
        text: title,
      },
      axisX: {
        title: 'Dažnis, Hz',
      },
      axisY: {
        title: 'Spektras X(f)',
      },
      data: [
        {
          type: 'line',
          dataPoints: buildChartData({buffer, sampleRate}),
        },
      ],
    }),
    [title, buffer, sampleRate],
  );

  return <CanvasJSChart options={options} />;
});

const buildChartData = ({buffer, sampleRate}: {buffer: Float64Array; sampleRate: number}) => {
  const maxReachableFrequency = sampleRate / 2;
  return buffer.reduce<DataPoint[]>((acc, currentValue, currentIndex) => {
    const frequency = (currentIndex * maxReachableFrequency) / buffer.length;
    acc.push({
      x: frequency,
      y: currentValue,
    });

    return acc;
  }, []);
};
