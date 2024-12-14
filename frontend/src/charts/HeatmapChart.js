import React from "react";
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Title,
  MatrixController,
  MatrixElement
);

const HeatmapChart = ({ data }) => {
  const filteredData = data.filter(
    (d) => d.LAUNCH_ANGLE !== null && d.EXIT_SPEED !== null
  );

  // Bin data into 10-unit intervals for launch angle and exit speed
  const bins = {};
  const binSize = 10;
  const minLaunchAngle = -90;
  const maxLaunchAngle = 90;
  const minExitSpeed = 0;
  const maxExitSpeed = 120;

  // Initialize bins
  for (let x = minLaunchAngle; x <= maxLaunchAngle; x += binSize) {
    for (let y = minExitSpeed; y <= maxExitSpeed; y += binSize) {
      bins[`${x},${y}`] = 0;
    }
  }

  // Populate bins with data
  filteredData.forEach((d) => {
    const xBin = Math.floor(d.LAUNCH_ANGLE / binSize) * binSize;
    const yBin = Math.floor(d.EXIT_SPEED / binSize) * binSize;
    if (bins[`${xBin},${yBin}`] !== undefined) {
      bins[`${xBin},${yBin}`]++;
    }
  });

  // Prepare heatmap data
  const heatmapData = Object.entries(bins).map(([key, value]) => {
    const [x, y] = key.split(",").map(Number);
    return {
      x,
      y,
      v: value, // Value (density) in the bin
    };
  });

  const chartData = {
    datasets: [
      {
        label: "Hit Density",
        data: heatmapData,
        backgroundColor: (context) => {
          const value = context.dataset.data[context.dataIndex].v;
          return `rgba(255, ${255 - value * 10}, 0, 0.7)`; // Gradient
        },
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderWidth: 1,
        width: binSize,
        height: binSize,
      },
    ],
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items) => `Launch Angle: ${items[0].raw.x}°`,
          label: (item) =>
            `Exit Speed: ${item.raw.y} mph\nHits: ${item.raw.v}`,
        },
      },
      title: {
        display: true,
        text: "Hit Density by Launch Angle and Exit Speed",
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: true,
          text: "Launch Angle (°)",
        },
        min: minLaunchAngle,
        max: maxLaunchAngle,
        ticks: {
          stepSize: binSize,
        },
      },
      y: {
        type: "linear",
        title: {
          display: true,
          text: "Exit Speed (mph)",
        },
        min: minExitSpeed,
        max: maxExitSpeed,
        ticks: {
          stepSize: binSize,
        },
      },
    },
  };

  return (
    <div className="chart-container">
      <Chart type="matrix" data={chartData} options={options} />
    </div>
  );
};

export default HeatmapChart;
