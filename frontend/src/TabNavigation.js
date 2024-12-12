import React from "react";
import "./App.css";

const TabNavigation = ({ tabs, selectedTab, onTabSelect }) => {
  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-button ${tab === selectedTab ? "active" : ""}`}
          onClick={() => onTabSelect(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
