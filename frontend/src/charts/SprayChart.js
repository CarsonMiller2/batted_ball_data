import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const SprayChart = ({ data }) => {
  const ref = useRef();

  // Nothing is being done with the LF and RF measurements, but it could be in the future.
  const fieldDimensions = {
    "Truist Park (Braves)": { LF: 335, CF: 400, RF: 325 },
    "Oriole Park (Orioles)": { LF: 333, CF: 400, RF: 318 },
    "Fenway Park (Red Sox)": { LF: 310, CF: 390, RF: 302 },
    "Wrigley Field (Cubs)": { LF: 355, CF: 400, RF: 353 },
    "Guaranteed Rate Field (White Sox)": { LF: 330, CF: 400, RF: 335 },
    "Great American Ball Park (Reds)": { LF: 328, CF: 404, RF: 325 },
    "Progressive Field (Guardians)": { LF: 325, CF: 400, RF: 325 },
    "Coors Field (Rockies)": { LF: 347, CF: 415, RF: 350 },
    "Comerica Park (Tigers)": { LF: 342, CF: 412, RF: 330 },
    "Minute Maid Park (Astros)": { LF: 315, CF: 409, RF: 326 },
    "Kauffman Stadium (Royals)": { LF: 330, CF: 410, RF: 330 },
    "Angel Stadium (Angels)": { LF: 347, CF: 396, RF: 350 },
    "Dodger Stadium (Dodgers)": { LF: 330, CF: 400, RF: 330 },
    "LoanDepot Park (Marlins)": { LF: 344, CF: 407, RF: 335 },
    "American Family Field (Brewers)": { LF: 344, CF: 400, RF: 345 },
    "Target Field (Twins)": { LF: 339, CF: 403, RF: 328 },
    "Citi Field (Mets)": { LF: 335, CF: 408, RF: 330 },
    "Yankee Stadium (Yankees)": { LF: 318, CF: 408, RF: 314 },
    "Oakland Coliseum (Athletics)": { LF: 330, CF: 400, RF: 330 },
    "Citizens Bank Park (Phillies)": { LF: 329, CF: 401, RF: 330 },
    "PNC Park (Pirates)": { LF: 325, CF: 399, RF: 320 },
    "Petco Park (Padres)": { LF: 334, CF: 396, RF: 322 },
    "Oracle Park (Giants)": { LF: 339, CF: 399, RF: 309 },
    "T-Mobile Park (Mariners)": { LF: 331, CF: 401, RF: 326 },
    "Busch Stadium (Cardinals)": { LF: 336, CF: 400, RF: 335 },
    "Tropicana Field (Rays)": { LF: 315, CF: 404, RF: 322 },
    "Globe Life Field (Rangers)": { LF: 329, CF: 407, RF: 326 },
    "Rogers Centre (Blue Jays)": { LF: 328, CF: 400, RF: 328 },
    "Nationals Park (Nationals)": { LF: 336, CF: 402, RF: 335 },
  };
  

  // Keep track of current field
  const [selectedField, setSelectedField] = useState("Truist Park (Braves)");

  useEffect(() => {
    // Set up SVG stuff
    const fieldWidth = 700;
    const fieldHeight = 500;
    const svgWidth = 1000;
    const svgHeight = 600;
  
    const svg = d3.select(ref.current)
      .attr("width", svgWidth)
      .attr("height", svgHeight);
  
    svg.selectAll("*").remove();
  
    // I eyeballed the location of home plate
    const homePlateX = svgWidth / 2 - 3;
    const homePlateY = svgHeight - 145;
  
    // Again, not actually using LF and RF
    const { LF, CF, RF } = fieldDimensions[selectedField];
    const fieldRadiusFeet = CF;
    const scale = (fieldHeight - 50) / fieldRadiusFeet;
  
    // Transform the input data into coordinates scaled to the field dimensions
    const points = data
      .map((d) => {
        if (d.EXIT_DIRECTION == null || d.HIT_DISTANCE == null) return null;
  
        const angleRad = d.EXIT_DIRECTION * (Math.PI / 180);
        const x_ft = Math.sin(angleRad) * d.HIT_DISTANCE;
        const y_ft = Math.cos(angleRad) * d.HIT_DISTANCE;
  
        const x_px = homePlateX + x_ft * scale;
        const y_px = homePlateY - y_ft * scale;
  
        return { ...d, x_px, y_px };
      })
      .filter(Boolean);
  
    // Turn the data points into circles
    svg.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x_px)
      .attr("cy", (d) => d.y_px)
      .attr("r", 4)
      .attr("fill", "red")
      .attr("opacity", 0.7)
      .on("click", (event, d) => {
        if (d.VIDEO_LINK) {
          window.open(d.VIDEO_LINK, "_blank");
        }
      })
      .append("title") //Tooltips should admittedly be consistent between pages of the site
      .text(
        (d) =>
          `Batter: ${d.BATTER}\nPitcher: ${d.PITCHER}\nDistance: ${d.HIT_DISTANCE} ft\nOutcome: ${d.PLAY_OUTCOME}`
      );
  
    // The circle represents the home plate location
    svg.append("circle")
      .attr("cx", homePlateX)
      .attr("cy", homePlateY)
      .attr("r", 5)
      .attr("fill", "blue");
  }, [data, selectedField]);
  
  return (
    <div style={{ position: "relative", width: "1000px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          marginBottom: "10px",
          fontSize: "14px",
          color: "#555",
          textAlign: "center",
        }}
      >
        {/* field selection */}
        <p>Select an MLB field to adjust the spray chart:</p>
        <select
          value={selectedField}
          onChange={(e) => setSelectedField(e.target.value)}
          style={{ marginBottom: "20px", padding: "5px", fontSize: "14px" }}
        >
          {Object.keys(fieldDimensions).map((field) => (
            <option key={field} value={field}>
              {field}
            </option>
          ))}
        </select>
      </div>

      {/* field image */}
      <div style={{ position: "relative", width: "1000px", height: "600px" }}>
        <img
          src="field.png"
          alt="Baseball Field"
          style={{
            position: "absolute",
            width: "700px",
            height: "500px",
            top: "50px",
            left: "150px",
          }}
        />
        <svg
          ref={ref}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        ></svg>
      </div>
    </div>
  );
};

export default SprayChart;
