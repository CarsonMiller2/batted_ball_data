from flask import Flask, jsonify, request, g
import sqlite3
from flask_cors import CORS
import time
import pandas as pd
import logging
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)

cwd=os.getcwd()
print(f"CWD: {cwd}")
DB_PATH = os.getenv("DB_PATH", "../data/BattedBallData.db")
DATA_PATH = os.getenv("DATA_PATH", "../data/BattedBallData.xlsx")

def ensure_database_exists():
    try:
        if not os.path.exists(DATA_PATH):
            logging.error(f"Data file missing: {DATA_PATH}")
            raise FileNotFoundError(f"Excel file not found: {DATA_PATH}")

        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='batted_ball_data';")
            table_exists = cur.fetchone()

            if not table_exists:
                logging.info("Table batted_ball_data not found. Creating the database from Excel...")
                df = pd.read_excel(DATA_PATH)
                df.to_sql("batted_ball_data", conn, if_exists="replace", index=False)
                logging.info("Database created successfully.")

            # Index on frequently queried columns
            cur.execute("CREATE INDEX IF NOT EXISTS idx_batter ON batted_ball_data (BATTER);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_pitcher ON batted_ball_data (PITCHER);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_exit_speed ON batted_ball_data (EXIT_SPEED);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_launch_angle ON batted_ball_data (LAUNCH_ANGLE);")
    except Exception as e:
        logging.error(f"Error ensuring database exists: {e}")
        raise

ensure_database_exists()

def build_filter_query(filter_name, filter_value, param_list):
    if filter_value:
        query_part = f" AND LOWER({filter_name}) LIKE ?"
        param_list.append(f"%{filter_value.strip().lower()}%")
        return query_part
    return ""

@app.before_request
def start_timer():
    g.start = time.time()

@app.after_request
def log_request(response):
    duration = time.time() - g.start
    status_code = response.status_code
    logging.info(f"{request.method} {request.path} completed in {duration:.3f}s with status {status_code}")
    return response

@app.route("/api/data", methods=["GET"])
def get_data():
    try:
        hitter = request.args.get('hitter', '').strip().lower()
        pitcher = request.args.get('pitcher', '').strip().lower()
        min_exit_speed = float(request.args.get('minExitSpeed', 0))
        max_exit_speed = float(request.args.get('maxExitSpeed', 120))
        min_launch_angle = float(request.args.get('minLaunchAngle', -90))
        max_launch_angle = float(request.args.get('maxLaunchAngle', 90))
        play_outcome = request.args.get('playOutcome', 'All').lower()

        query = """
            SELECT BATTER, PITCHER, GAME_DATE, LAUNCH_ANGLE, EXIT_SPEED,
                   EXIT_DIRECTION, HIT_DISTANCE, PLAY_OUTCOME, VIDEO_LINK
            FROM batted_ball_data
            WHERE EXIT_SPEED BETWEEN ? AND ?
              AND LAUNCH_ANGLE BETWEEN ? AND ?
        """
        params = [min_exit_speed, max_exit_speed, min_launch_angle, max_launch_angle]

        query += build_filter_query("BATTER", hitter, params)
        query += build_filter_query("PITCHER", pitcher, params)

        if play_outcome != 'all':
            query += " AND LOWER(PLAY_OUTCOME) = ?"
            params.append(play_outcome)

        with sqlite3.connect(DB_PATH) as conn:
            cur = conn.cursor()
            cur.execute(query, params)
            results = cur.fetchall()

        columns = ["BATTER", "PITCHER", "GAME_DATE", "LAUNCH_ANGLE", "EXIT_SPEED", "EXIT_DIRECTION", "HIT_DISTANCE", "PLAY_OUTCOME", "VIDEO_LINK"]
        filtered_data = [dict(zip(columns, row)) for row in results]

        return jsonify(filtered_data)
    except Exception as e:
        logging.error(f"Error processing /api/data request: {e}")
        return jsonify({"error": "An error occurred while processing your request."}), 500

if __name__ == "__main__":
    app.run(debug=False)  # Running with Gunicorn on EC2
