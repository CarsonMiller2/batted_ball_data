import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import './App.css';

import TabNavigation from "./TabNavigation";
import AllBattedBallsChart from "./charts/AllBattedBallsChart";
import ScatterPlots from "./charts/ScatterPlots";
import HeatmapChart from "./charts/HeatmapChart";
import SprayChart from "./charts/SprayChart";

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

const FilterInput = ({ label, type, value, onChange, options, suggestions, onSelect }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  const handleFocus = () => setShowSuggestions(true);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
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
          onChange={(e) =>
            onChange(type === "number" ? Number(e.target.value) : e.target.value)
          }
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
  const [selectedTab, setSelectedTab] = useState("All Batted Balls"); // Default tab

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
    axios 
      .get("http://127.0.0.1:5000/api/data")
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error loading initial data:", error));
  }, []);

  const fetchFilteredData = useCallback(() => {
    const params = new URLSearchParams({
      hitter: filter.hitter,
      pitcher: filter.pitcher,
      minExitSpeed: filter.minExitSpeed,
      maxExitSpeed: filter.maxExitSpeed,
      minLaunchAngle: filter.minLaunchAngle,
      maxLaunchAngle: filter.maxLaunchAngle,
      playOutcome: filter.playOutcome,
    });
    axios
      .get(`http://127.0.0.1:5000/api/data?${params.toString()}`)
      .then((response) => setData(response.data))
      .catch((error) => console.error("Error fetching filtered data:", error));
  }, [filter]);

  const filteredHitterSuggestions = getPrefixSuggestions(allHitters, filter.hitter);
  const filteredPitcherSuggestions = getPrefixSuggestions(allPitchers, filter.pitcher);

  let content;
  if (selectedTab === "All Batted Balls") {
    content = <AllBattedBallsChart data={data} />;
  } else if (selectedTab === "README") {
    content = (
      <div className="readme-content">
        <p>
          Thanks for giving me a chance to show what I can do. I spent more time on optimizing some of these queries than I did on 
          making the site look pretty. On the client side, I've implemented some caching and a binary search on the player lists. On 
          the server side, I have a SQLite database optimized with indexes on frequently queried fields like BATTER and PITCHER. I spent 
          a lot of time learning how to do little things like debouncing, since there are over 7000 data points and it was running slowly. 
          Thanks again!
        </p>
      </div>);
  } else if (selectedTab === "Heatmaps") {
    content = <HeatmapChart data={data} />;
  } else if (selectedTab === "Spray Chart") {
    content = <SprayChart data={data} />;
  } else if (selectedTab === "Scatter Plots") {
    content = <ScatterPlots data={data} />;
  }
  
  

  return (
    <div className="App">
      <h1>Batted Ball Visualizer</h1>
      <TabNavigation
        tabs={["All Batted Balls", "README", "Spray Chart", "Scatter Plots", "Heatmaps"]}
        selectedTab={selectedTab}
        onTabSelect={setSelectedTab}
      />
      <form className="filter-form">
        <div className="filter-group">
          <FilterInput
            label="Hitter"
            type="text"
            value={filter.hitter}
            onChange={(value) => setFilter({ ...filter, hitter: value })}
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
            suggestions={filteredPitcherSuggestions}
            onSelect={(name) => setFilter({ ...filter, pitcher: name })}
          />
        </div>

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

      {content}
    </div>
  );
}

export default App;
