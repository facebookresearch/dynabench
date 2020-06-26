import React from 'react';
import {
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Defaults for mobile
const Rechart = ({
  size: {
    align = 'center',
    fontSize = 10,
    height = 250,
    left = -40,
    legendAlign = null,
    right = 10,
    verticalAlign = 'bottom',
    width = '100%',
    xAxisLeftPadding = 25,
  },
  data,
}) => {
  // This only handles up to 10 chart lines, not sure what we can do if there's more.
  const globalColors = [
    '#6fb98f',
    '#075756',
    '#66a5ad',
    '#31bdb5',
    '#91d8d3',
    '#90b96f',
    '#a1de72',
    '#8ce882',
    '#1283d8',
    '#314dbd',
  ];
  const dataset = Object.keys(data[0]).filter((item) => item != 'name');
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart margin={{ left, right }} data={data}>
        <XAxis
          allowDecimals={false}
          dataKey="name"
          padding={{ left: xAxisLeftPadding }}
          tick={{ fontSize }}
          tickLine={false}
        />
        <YAxis
          interval="preserveStartEnd"
          tick={false}
          padding={{ top: 10 }}
          tick={{ fontSize }}
        />
        <ChartTooltip />
        <Legend
          align={align}
          layout={verticalAlign == 'top' ? 'vertical' : 'horizontal'}
          wrapperStyle={{
            fontSize,
            right: legendAlign,
          }}
          verticalAlign={verticalAlign}
        />
        {dataset.map((item, index) => (
          <Line
            dataKey={item}
            dot={{ fill: globalColors[index] }}
            stroke={globalColors[index]}
            strokeWidth={2}
            type="linear"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default Rechart;