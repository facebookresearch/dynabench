import React from 'react';
import {
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
/**
 * API Documentation for Recharts Line Chart - {@link https://recharts.org/en-US/api/LineChart}
 * @param align - For the legend, center works well when the verticalAlign is bottom
 * @param fontSize - Size of font for legend, x axis and y axis labels
 * @param height - height for chart
 * @param left - margin left for chart
 * @param legendAlign - right positioning for legend
 * @param right - margin right for chart
 * @param verticalAlign - position of legend, whether it should be below graph, above, in middle
 * @param width - width of the chart, can be % or px
 * @param xAxisLeftPadding - left padding for x axis ticks
 */
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
  if (dataset.length > 10) {
    const difference = dataset.length - 10;
    for (let i = 0; i < difference; i++) {
      const newColor = generateColors();
      globalColors.push(newColor);
    }
  }
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
          padding={{ top: 10 }}
          tick={{ fontSize }}
        />
        <Tooltip
          allowEscapeViewBox={{ x: false, y: true }}
          wrapperStyle={{ zIndex: 10 }}
        />
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
            key={index}
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

/**
 * Generates colors between blue and green ranges if the dataset needs to plot more than 10 lines
 * #46 is set as R value so that the green and blue values aren't too light or dark
 */
const generateColors = () => {
  let hex = '#46';
  for (let i = 0; i < 2; i++) {
    let colorValue = Number(
      Math.floor(Math.round((Math.random() * 255) / 10) * 10)
    ).toString(16);
    if (colorValue.length < 2) {
      colorValue = '0' + colorValue;
    }
    hex += colorValue;
  }
  return hex;
};

export default Rechart;
