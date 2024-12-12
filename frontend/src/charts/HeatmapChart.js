// HeatmapChart.js
import React, { useMemo } from "react";
import Plot from "react-plotly.js";

const HeatmapChart = ({ data }) => {
  const binsDirection = 20;
  const binsAngle = 20;

  const { xValues, yValues } = useMemo(() => {
    const xVals = data.map(d => d.EXIT_DIRECTION).filter(d => d !== undefined && d !== null);
    const yVals = data.map(d => d.LAUNCH_ANGLE).filter(d => d !== undefined && d !== null);
    return { xValues: xVals, yValues: yVals };
  }, [data]);

  const xMin = -45; 
  const xMax = 45; 
  const yMin = -90;
  const yMax = 90;

  const xStep = (xMax - xMin) / binsDirection;
  const yStep = (yMax - yMin) / binsAngle;

  const heatmapArray = Array.from({ length: binsAngle }, () =>
    Array.from({ length: binsDirection }, () => 0)
  );

  xValues.forEach((xVal, i) => {
    const yVal = yValues[i];
    if (xVal >= xMin && xVal <= xMax && yVal >= yMin && yVal <= yMax) {
      const xIndex = Math.floor((xVal - xMin) / xStep);
      const yIndex = Math.floor((yVal - yMin) / yStep);
      heatmapArray[yIndex][xIndex] += 1;
    }
  });

  const xBinCenters = Array.from({ length: binsDirection }, (_, i) => xMin + xStep * (i + 0.5));
  const yBinCenters = Array.from({ length: binsAngle }, (_, i) => yMin + yStep * (i + 0.5));

  return (
    <div>
      <Plot
        data={[
          {
            z: heatmapArray,
            x: xBinCenters,
            y: yBinCenters,
            type: 'heatmap',
            colorscale: 'RdBu',
            reversescale: true
          }
        ]}
        layout={{
          width: 700,
          height: 500,
          title: "Heatmap: EXIT_DIRECTION vs LAUNCH_ANGLE",
          xaxis: { title: "Exit Direction (°)" },
          yaxis: { title: "Launch Angle (°)" },
        }}
      />
    </div>
  );
};

export default HeatmapChart;
