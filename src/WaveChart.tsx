import React, {useMemo} from 'react';
import CanvasJSReact from './canvasjs/canvasjs.react';
import {DataPoint} from './canvasjs/types';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const ONE_SECOND = 1;

interface WaveChartProps {
  title: string;
  buffer: Float32Array;
  sampleRate: number;
  startTime?: number;
}

export const WaveChart: React.FC<WaveChartProps> = React.memo(({title, buffer, sampleRate, startTime}) => {
  const options = useMemo(
    () => ({
      zoomEnabled: true,
      animationEnabled: true,
      title: {
        text: title,
      },
      axisX: {
        title: 't, s',
      },
      axisY: {
        title: 's(t)',
        minimum: -1,
        maximum: 1,
      },
      data: [
        {
          type: 'line',
          dataPoints: buildChartData({buffer, sampleRate, startTime}),
        },
      ],
    }),
    [title, buffer, sampleRate],
  );

  return <CanvasJSChart options={options} />;
});

const buildChartData = ({
  buffer,
  sampleRate,
  startTime,
}: {
  buffer: Float32Array;
  sampleRate: number;
  startTime?: number;
}) => {
  const period = ONE_SECOND / sampleRate;

  return buffer.reduce<DataPoint[]>((acc, currentValue, currentIndex) => {
    acc.push({
      x: currentIndex * period + (startTime ?? 0),
      y: currentValue,
    });

    return acc;
  }, []);
};
