import React from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

const ScatterPlots = ({ data }) => {
  const filteredData = data.filter(
    (d) => d.LAUNCH_ANGLE !== null && d.EXIT_SPEED !== null && d.HIT_DISTANCE !== null
  );

  // Dataset for Launch Angle vs Exit Velocity
  const launchAngleExitVelo = {
    datasets: [
      {
        label: "Launch Angle vs Exit Velocity",
        data: filteredData.map((d) => ({
          x: d.LAUNCH_ANGLE,
          y: d.EXIT_SPEED,
        })),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };

  // Dataset for Exit Speed vs Hit Distance
  const exitSpeedHitDistance = {
    datasets: [
      {
        label: "Exit Speed vs Hit Distance",
        data: filteredData.map((d) => ({
          x: d.EXIT_SPEED,
          y: d.HIT_DISTANCE,
        })),
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      },
    ],
  };

  // Chart options
  const optionsLaunchAngleExitVelo = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Launch Angle (degrees)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Exit Velocity (mph)",
        },
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        display: false,
      },
    },
  };

  // Chart options
  const optionsExitSpeedHitDistance = {
    scales: {
      x: {
        title: {
          display: true,
          text: "Exit Speed (mph)",
        },
      },
      y: {
        title: {
          display: true,
          text: "Hit Distance (feet)",
        },
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="scatter-plots-container">
      <div className="chart-container">
        <h3>Launch Angle vs Exit Velocity</h3>
        <Scatter data={launchAngleExitVelo} options={optionsLaunchAngleExitVelo} />
      </div>
      <div className="chart-container">
        <h3>Exit Speed vs Hit Distance</h3>
        <Scatter data={exitSpeedHitDistance} options={optionsExitSpeedHitDistance} />
      </div>
    </div>
  );
};

export default ScatterPlots;
