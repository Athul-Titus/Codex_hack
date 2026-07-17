from database import SessionLocal
from anomaly import compute_all_flags
db = SessionLocal()
result = compute_all_flags(db)
db.close()
summary = result['summary']
print(f"Total flags: {summary['total_flags']} (red={summary['red']}, yellow={summary['yellow']})")
for f in result['flags']:
    print(f"  [{f['severity'].upper()}] {f['message']}")
