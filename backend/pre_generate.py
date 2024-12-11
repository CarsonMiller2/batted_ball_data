import sqlite3, json

db_path = "../data/BattedBallData.db"
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Fetch distinct hitters
cur.execute("SELECT DISTINCT LOWER(BATTER) FROM batted_ball_data WHERE BATTER IS NOT NULL")
hitters = [row[0] for row in cur.fetchall()]

# Fetch distinct pitchers
cur.execute("SELECT DISTINCT LOWER(PITCHER) FROM batted_ball_data WHERE PITCHER IS NOT NULL")
pitchers = [row[0] for row in cur.fetchall()]

conn.close()

# Sort and remove duplicates
hitters = sorted(set(hitters))
pitchers = sorted(set(pitchers))

with open("hitters.json", "w") as f:
    json.dump(hitters, f)

with open("pitchers.json", "w") as f:
    json.dump(pitchers, f)
