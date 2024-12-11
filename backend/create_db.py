import sqlite3
import pandas as pd

data_path = "../data/BattedBallData.xlsx"  # Path to Excel file
db_path = "../data/BattedBallData.db"      # Path SQLite database

print("Loading Excel file...")
df = pd.read_excel(data_path)

print("Creating SQLite database...")
conn = sqlite3.connect(db_path)
df.to_sql("batted_ball_data", conn, if_exists="replace", index=False)
conn.close()

print("Database created successfully!")
