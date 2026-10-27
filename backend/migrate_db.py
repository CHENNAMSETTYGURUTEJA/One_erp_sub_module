import os
import pymysql

conn = pymysql.connect(
    host="localhost",
    user="root",
    password=os.environ["DB_PASSWORD"],
    database="saperp",
)

with conn.cursor() as cur:
    cur.execute("DESCRIBE companies;")
    cols = [c[0] for c in cur.fetchall()]
    print("Existing columns:", cols)

    if "id" in cols and "company_id" not in cols:
        cur.execute("ALTER TABLE companies CHANGE COLUMN id company_id INT AUTO_INCREMENT;")
        print("Migrated 'id' to 'company_id'")

    if "created_by" not in cols:
        cur.execute("ALTER TABLE companies ADD COLUMN created_by VARCHAR(50) DEFAULT 'SYSTEM';")
        print("Added 'created_by'")

    if "updated_by" not in cols:
        cur.execute("ALTER TABLE companies ADD COLUMN updated_by VARCHAR(50) DEFAULT 'SYSTEM';")
        print("Added 'updated_by'")

conn.commit()
conn.close()
print("Migration completed successfully!")
