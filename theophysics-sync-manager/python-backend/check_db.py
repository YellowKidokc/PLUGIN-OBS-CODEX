import os
import psycopg2

os.environ["POSTGRES_HOST"] = "192.168.1.177"
os.environ["POSTGRES_PORT"] = "2665"
os.environ["POSTGRES_DB"] = "theophysics"
os.environ["POSTGRES_USER"] = "Yellowkid"
os.environ["POSTGRES_PASSWORD"] = "Moss9pep28$"

conn = psycopg2.connect(
    host='192.168.1.177',
    port=2665,
    dbname='theophysics',
    user='Yellowkid',
    password='Moss9pep28$'
)

cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = cur.fetchall()

print("Existing tables in 'theophysics' database:")
if tables:
    for t in tables:
        print(f"  - {t[0]}")
        
        # Get column info
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{t[0]}'
            ORDER BY ordinal_position
        """)
        cols = cur.fetchall()
        for col in cols:
            print(f"      {col[0]}: {col[1]}")
else:
    print("  (none)")

conn.close()
