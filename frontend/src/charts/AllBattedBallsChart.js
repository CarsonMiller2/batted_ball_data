import React, { useMemo, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from "recharts";

// TODO: Change this scatter to use ChartJS

// Debounce function to limit the frequency of calls to `func`
// Helps optimize hover events and avoid excessive state updates
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

const AllBattedBallsChart = React.memo(({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Memoized hover with debouncing
  // There are too many data points to do this without the delay
  const handleMouseOver = useMemo(
    () => debounce((payload) => setHoveredPoint(payload), 100),
    []
  );

  // On click, open video link in new tab. assumes there is a valid VIDEO_LINK
  const handleClick = (point) => {
    if (point.VIDEO_LINK) {
      window.open(point.VIDEO_LINK, "_blank");
    }
  };

  return (
    <div className="chart-wrapper">
      <div className="chart-container">
        {/* plot all data on scatter chart */}
        <ScatterChart
          width={700}
          height={500}
          margin={{ top: 30, right: 20, bottom: 80, left: 80 }}
        >
          {/*put a grid on the chart*/}
          <CartesianGrid strokeDasharray="3 3" />
          {/* X axis configuration for launch angle*/}
          <XAxis
            dataKey="LAUNCH_ANGLE"
            name="Launch Angle"
            unit="°"
            type="number"
            domain={[-90, 90]}
            label={{ value: "Launch Angle (°)", position: "insideBottomCenter", dy: 10 }}
          />
          {/* Y axis configuration for exit speed*/}
          <YAxis
            dataKey="EXIT_SPEED"
            name="Exit Speed"
            unit="mph"
            type="number"
            domain={[0, 120]}
            label={{ value: "Exit Speed (mph)", angle: -90, position: "insideLeftCenter", dx: -50 }}
          />
          <Scatter
            name="Batted Balls"
            data={data}
            fill="#8884d8"
            opacity={0.7}
            size={4}
            onMouseOver={(e) => e && handleMouseOver(e.payload)}
            onMouseOut={() => setHoveredPoint(null)}
            shape={(props) => (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={
                  hoveredPoint &&
                  hoveredPoint.LAUNCH_ANGLE === props.payload.LAUNCH_ANGLE &&
                  hoveredPoint.EXIT_SPEED === props.payload.EXIT_SPEED
                    ? 8
                    : 4
                }
                fill={
                  hoveredPoint &&
                  hoveredPoint.LAUNCH_ANGLE === props.payload.LAUNCH_ANGLE &&
                  hoveredPoint.EXIT_SPEED === props.payload.EXIT_SPEED
                    ? "#ff4757"
                    : "#8884d8"
                }
                opacity={hoveredPoint ? 1 : 0.7}
                onClick={() => handleClick(props.payload)}
                style={{ cursor: "pointer" }}
              />
            )}
          />
        </ScatterChart>
      </div>

      <div className="tooltip-container">
        <h4>Data Point Details</h4>
        {hoveredPoint ? (
          <div>
            <p><strong>Batter:</strong> {hoveredPoint.BATTER}</p>
            <p><strong>Pitcher:</strong> {hoveredPoint.PITCHER}</p>
            <p><strong>Launch Angle:</strong> {hoveredPoint.LAUNCH_ANGLE.toFixed(2)}°</p>
            <p><strong>Exit Speed:</strong> {hoveredPoint.EXIT_SPEED.toFixed(2)} mph</p>
            <p><strong>Outcome:</strong> {hoveredPoint.PLAY_OUTCOME || "N/A"}</p>
          </div>
        ) : (
          <p>Hover over a point to see details.</p>
        )}
      </div>
    </div>
  );
});

export default AllBattedBallsChart;
