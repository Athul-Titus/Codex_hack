"""
Seed script — populates the database with 5 staff members and 3 weeks of
attendance records containing deliberate anomaly patterns for demo purposes.

Anomaly patterns baked in:
  1. Priya Menon: late (after 10:00 AM) on most Mondays
  2. Arun Sharma + Faisal Khan: check-ins within 60s of each other on 3+ days (buddy-punch signal)
  3. Deepa Nair: 3+ missed shifts clustered on Fridays
  4. Rohit Verma + others: mostly normal attendance
"""

import sys
import os
from datetime import date, time, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal
from models import Base, Staff, Attendance

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def monday_of_week(ref: date, weeks_back: int) -> date:
    """Return the Monday of the week that is `weeks_back` weeks before ref."""
    today_monday = ref - timedelta(days=ref.weekday())
    return today_monday - timedelta(weeks=weeks_back)


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # ------------------------------------------------------------------
    # 1. Staff
    # ------------------------------------------------------------------
    staff_names = ["Priya Menon", "Arun Sharma", "Faisal Khan", "Deepa Nair", "Rohit Verma"]
    staff_objects = []
    for name in staff_names:
        s = Staff(name=name)
        db.add(s)
        staff_objects.append(s)
    db.flush()  # assigns IDs

    priya, arun, faisal, deepa, rohit = staff_objects

    # ------------------------------------------------------------------
    # 2. Build 3-week date range (Mon–Sat, skip Sunday)
    # ------------------------------------------------------------------
    anchor = date(2025, 7, 14)  # a known Monday
    weeks = [0, 1, 2]  # 0 = most recent, 2 = oldest
    work_days = []
    for w in weeks:
        monday = monday_of_week(anchor, w)
        for d in range(6):  # Mon–Sat
            work_days.append((monday + timedelta(days=d), w))

    # Helper: standard check-in/out with wider per-staff variance
    # Each staff member gets a different offset so they spread 5–20 min apart,
    # ensuring no accidental 2-minute proximity that would trigger buddy-punch detection.
    def normal(day_offset: int = 0) -> tuple[time, time]:
        h_in = 9
        m_in = 10 + (day_offset % 20)   # 9:10–9:29 spread across staff
        h_out = 18
        m_out = 5 + (day_offset % 20)   # 18:05–18:24
        return time(h_in, m_in), time(h_out, m_out)

    records = []

    # Fixed per-staff base check-in times — spaced 10+ minutes apart so
    # normal staff never accidentally land within the 2-min buddy-punch window.
    # Only Arun+Faisal are deliberately synchronised on buddy-punch days.
    # All "normal" times are before 9:30 so they don't trigger late-arrival detection.
    PRIYA_BASE_MIN  = 15   # 9:15 normally, 10:05-10:20 on Mondays
    ARUN_BASE_MIN   = 28   # 9:28 on buddy-punch days, 9:00 on normal days
    DEEPA_BASE_MIN  = 20   # 9:20 — arrives after Priya, before expected 9:30
    ROHIT_BASE_MIN  = 5    # 9:05 — first in, well separated from everyone

    for (d, week_idx) in work_days:
        dow = d.weekday()  # 0=Mon, 4=Fri, 5=Sat
        day_var = d.toordinal() % 5  # 0–4, adds tiny day-to-day variance

        # ---- PRIYA: late on Mondays (check_in 10:05–10:20) ----
        if dow == 0:
            ci = time(10, 5 + (week_idx * 5))
            co = time(18, 30)
        else:
            ci = time(9, PRIYA_BASE_MIN + day_var)
            co = time(18, 20 + day_var)
        records.append(Attendance(staff=priya, date=d, check_in=ci, check_out=co))

        # ---- ARUN + FAISAL: buddy-punch on Mon/Wed/Fri (check-ins same minute) ----
        if dow in (0, 2, 4):
            ci_a = time(9, ARUN_BASE_MIN)
            ci_f = time(9, ARUN_BASE_MIN)        # same minute — within 60s of Arun
            co_a = time(18, 5)
            co_f = time(18, 10)
        else:
            ci_a = time(9, 0 + day_var)          # 9:00-9:04 on non-buddy days
            ci_f = time(9, 10 + day_var)         # 9:10-9:14 — 10 min after Arun, before 9:30
            co_a = time(18, 0)
            co_f = time(18, 15)
        records.append(Attendance(staff=arun,   date=d, check_in=ci_a, check_out=co_a))
        records.append(Attendance(staff=faisal, date=d, check_in=ci_f, check_out=co_f))

        # ---- DEEPA: absent on Fridays (3 Fridays = 3 missed shifts on same weekday) ----
        if dow != 4:
            ci = time(9, DEEPA_BASE_MIN + day_var)  # 9:20–9:24 — before 9:30, well separated
            co = time(17, 55 + day_var)
            records.append(Attendance(staff=deepa, date=d, check_in=ci, check_out=co))

        # ---- ROHIT: normal attendance throughout ----
        ci = time(9, ROHIT_BASE_MIN + day_var)   # 9:05–9:09 — first in, far from others
        co = time(18, 10 + day_var)
        records.append(Attendance(staff=rohit, date=d, check_in=ci, check_out=co))

    for r in records:
        db.add(r)

    db.commit()
    db.close()

    print(f"[OK] Seeded {len(staff_names)} staff and {len(records)} attendance records.")
    print("   Anomaly patterns:")
    print("   - Priya Menon  : late every Monday (check-in ~10:05-10:20)")
    print("   - Arun + Faisal: synchronised check-ins on Mon/Wed/Fri (buddy-punch signal)")
    print("   - Deepa Nair   : absent all 3 Fridays (missed-shift clustering)")


if __name__ == "__main__":
    seed()
