import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const SprayChart = ({ data }) => {
  const ref = useRef();

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
  };

  const [selectedField, setSelectedField] = useState("Truist Park (Braves)");

  useEffect(() => {
    const fieldWidth = 700;
    const fieldHeight = 500;
    const svgWidth = 1000;
    const svgHeight = 800; // Increased to 800 pixels

    const svg = d3.select(ref.current)
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    svg.selectAll("*").remove();

    const homePlateX = svgWidth / 2 - 3;
    const homePlateY = svgHeight - 345; // Adjusted for new height

    const { LF, CF, RF } = fieldDimensions[selectedField];
    const fieldRadiusFeet = Math.max(LF, CF, RF);
    const scale = (fieldHeight - 50) / fieldRadiusFeet;

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

    svg.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => d.x_px)
      .attr("cy", (d) => d.y_px)
      .attr("r", 4)
      .attr("fill", "red")
      .attr("opacity", 0.7)
      .append("title")
      .text(
        (d) =>
          `Batter: ${d.BATTER}\nPitcher: ${d.PITCHER}\nDistance: ${d.HIT_DISTANCE} ft\nOutcome: ${d.PLAY_OUTCOME}`
      );

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

      {/* Spray Chart Section */}
      <div style={{ position: "relative", width: "1000px", height: "800px" }}>
        <img
          src="field.png"
          alt="Baseball Field"
          style={{
            position: "absolute",
            width: "700px",
            height: "500px",
            top: "150px", // Adjusted for larger SVG
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