import React, { useEffect, useState, useCallback, useMemo, useRef, containerRef } from "react";
import axios from "axios";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { FixedSizeList } from "react-window";
import './App.css';

const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Binary search utilities
function lowerBound(arr, prefix) {
  let left = 0;
  let right = arr.length;
  while (left < right) {
    const mid = (left + right) >>> 1;
    if (arr[mid] < prefix) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}

function upperBound(arr, prefix) {
  let left = 0;
  let right = arr.length;
  while (left < right) {
    const mid = (left + right) >>> 1;
    if (arr[mid] <= prefix) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return left;
}

function getPrefixSuggestions(arr, prefix) {
  if (!prefix) return [];
  prefix = prefix.toLowerCase();
  const start = lowerBound(arr, prefix);
  const end = upperBound(arr, prefix + '\uffff');
  return arr.slice(start, end).slice(0, 5);
}

// Abstracted input component for filters
const FilterInput = ({ label, type, value, onChange, options, suggestions, onSelect }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const handleFocus = () => setShowSuggestions(true);

  // Close the suggestions box if the user clicks outside of the text box. Does not work and it's very minor but very annoying
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    // Listen for mousedown events to capture clicks
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="filter-input" ref={containerRef}>
      <label>{label}</label>
      {type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          onFocus={handleFocus}
        />
      )}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div className="suggestion-list-container">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                onSelect(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SuggestionList = React.memo(({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="suggestion-list-container">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="suggestion-item"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
});

const MyChart = React.memo(({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const handleMouseOver = useMemo(
    () => debounce((payload) => setHoveredPoint(payload), 100),
    []
  );

  return (
    <div className="chart-wrapper">
      <div className="chart-container">
        <ScatterChart
          width={700}
          height={500}
          margin={{ top: 30, right: 20, bottom: 80, left: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="LAUNCH_ANGLE"
            name="Launch Angle"
            unit="°"
            type="number"
            domain={[-90, 90]}
            label={{ value: "Launch Angle (°)", position: "insideBottomCenter", dy: 10 }}
          />
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

function App() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState({
    hitter: "",
    pitcher: "",
    minExitSpeed: 0,
    maxExitSpeed: 120,
    minLaunchAngle: -90,
    maxLaunchAngle: 90,
    playOutcome: "All",
  });

  const [allHitters, setAllHitters] = useState([]);
  const [allPitchers, setAllPitchers] = useState([]);

  useEffect(() => {
    async function loadData() {
      const hittersRes = await fetch("/hitters.json").then((r) => r.json());
      const pitchersRes = await fetch("/pitchers.json").then((r) => r.json());
      setAllHitters(hittersRes.sort());
      setAllPitchers(pitchersRes.sort());
    }
    loadData();
  }, []);

  useEffect(() => {
    // Load initial data when the component mounts
    axios
      .get("http://127.0.0.1:5000/api/data")
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error loading initial data:", error));
  }, []);

  const fetchFilteredData = useCallback(() => {
    const params = new URLSearchParams(filter);
    axios
      .get(`http://127.0.0.1:5000/api/data?${params.toString()}`)
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error fetching filtered data:", error));
  }, [filter]);

  const filteredHitterSuggestions = getPrefixSuggestions(allHitters, filter.hitter);
  const filteredPitcherSuggestions = getPrefixSuggestions(allPitchers, filter.pitcher);

  return (
    <div className="App">
      <h1>Batted Ball Visualizer</h1>
      <form className="filter-form">
        <div className="filter-group">
          <FilterInput
            label="Hitter"
            type="text"
            value={filter.hitter}
            onChange={(value) => setFilter({ ...filter, hitter: value })}
          />
          <SuggestionList
            suggestions={filteredHitterSuggestions}
            onSelect={(name) => setFilter({ ...filter, hitter: name })}
          />
        </div>

        <div className="filter-group">
          <FilterInput
            label="Pitcher"
            type="text"
            value={filter.pitcher}
            onChange={(value) => setFilter({ ...filter, pitcher: value })}
          />
          <SuggestionList
            suggestions={filteredPitcherSuggestions}
            onSelect={(name) => setFilter({ ...filter, pitcher: name })}
          />
        </div>

        <SuggestionList
          suggestions={filteredPitcherSuggestions}
          onSelect={(name) => setFilter({ ...filter, pitcher: name })}
        />

        <FilterInput
          label="Min Exit Speed"
          type="number"
          value={filter.minExitSpeed}
          onChange={(value) => setFilter({ ...filter, minExitSpeed: value })}
        />

        <FilterInput
          label="Max Exit Speed"
          type="number"
          value={filter.maxExitSpeed}
          onChange={(value) => setFilter({ ...filter, maxExitSpeed: value })}
        />

        <FilterInput
          label="Min Launch Angle"
          type="number"
          value={filter.minLaunchAngle}
          onChange={(value) => setFilter({ ...filter, minLaunchAngle: value })}
        />

        <FilterInput
          label="Max Launch Angle"
          type="number"
          value={filter.maxLaunchAngle}
          onChange={(value) => setFilter({ ...filter, maxLaunchAngle: value })}
        />

        <FilterInput
          label="Play Outcome"
          type="select"
          value={filter.playOutcome}
          onChange={(value) => setFilter({ ...filter, playOutcome: value })}
          options={["All", "HomeRun", "Out", "Single", "Double", "Triple"]}
        />

        <button type="button" onClick={fetchFilteredData} className="apply-filters">
          Apply Filters
        </button>
      </form>

      <MyChart data={data} />
    </div>
  );
}

export default App;
