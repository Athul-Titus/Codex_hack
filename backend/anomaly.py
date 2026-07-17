"""
Real anomaly detection logic for Workforce Pulse.

Three detectors:
  1. late_arrival_flags   — flags staff late >40% of shifts, notes weekday clustering
  2. buddy_punch_flags    — flags pairs whose check-ins are within 2 minutes on 2+ occasions
  3. missed_shift_flags   — flags staff whose absences cluster on the same weekday 2+ times
"""

from collections import defaultdict
from datetime import datetime, time
from typing import Any

from sqlalchemy.orm import Session

from models import Staff, Attendance


# ---------------------------------------------------------------------------
# 1. Late arrival detection
# ---------------------------------------------------------------------------
EXPECTED_CHECKIN = time(9, 30)
LATE_THRESHOLD_MINUTES = 0  # any minute after 09:30 counts as late


def _is_late(check_in: time) -> bool:
    return check_in > EXPECTED_CHECKIN


def late_arrival_flags(db: Session) -> list[dict[str, Any]]:
    """
    Flag staff who are late on >40% of their recorded shifts.
    Also detect if lateness clusters on a specific weekday.
    """
    flags = []
    staff_list = db.query(Staff).all()

    for s in staff_list:
        records = db.query(Attendance).filter(
            Attendance.staff_id == s.id,
            Attendance.check_in.isnot(None),
        ).all()

        if not records:
            continue

        late_records = [r for r in records if _is_late(r.check_in)]
        late_pct = len(late_records) / len(records)

        if late_pct > 0.40:
            # Check weekday clustering
            weekday_counts: dict[int, int] = defaultdict(int)
            for r in late_records:
                weekday_counts[r.date.weekday()] += 1

            # A weekday is "clustered" if it accounts for >50% of late instances
            weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            clustered_day = None
            for wd, cnt in weekday_counts.items():
                if cnt / len(late_records) >= 0.5:
                    clustered_day = weekday_names[wd]
                    break

            flags.append({
                "type": "late_arrival",
                "severity": "red",
                "staff_id": s.id,
                "staff_name": s.name,
                "late_count": len(late_records),
                "total_shifts": len(records),
                "late_pct": round(late_pct * 100, 1),
                "clustered_weekday": clustered_day,
                "message": (
                    f"{s.name} was late on {len(late_records)} of {len(records)} shifts "
                    f"({round(late_pct * 100)}%)"
                    + (f", mostly on {clustered_day}s." if clustered_day else ".")
                ),
            })

    return flags


# ---------------------------------------------------------------------------
# 2. Buddy-punch (punch-time proximity) detection
# ---------------------------------------------------------------------------
PROXIMITY_MINUTES = 2
MIN_OCCURRENCES = 2


def _time_diff_minutes(t1: time, t2: time) -> float:
    dt1 = datetime.combine(datetime.today(), t1)
    dt2 = datetime.combine(datetime.today(), t2)
    return abs((dt1 - dt2).total_seconds()) / 60


def buddy_punch_flags(db: Session) -> list[dict[str, Any]]:
    """
    Flag pairs of staff whose check-in times are within PROXIMITY_MINUTES
    of each other on MIN_OCCURRENCES or more distinct days.
    """
    flags = []
    staff_list = db.query(Staff).all()

    # Build map: date -> [(staff_id, staff_name, check_in)]
    date_map: dict[Any, list[tuple[int, str, time]]] = defaultdict(list)
    for s in staff_list:
        records = db.query(Attendance).filter(
            Attendance.staff_id == s.id,
            Attendance.check_in.isnot(None),
        ).all()
        for r in records:
            date_map[r.date].append((s.id, s.name, r.check_in))

    # Check all pairs per day
    pair_dates: dict[tuple[int, int], list[Any]] = defaultdict(list)
    for d, entries in date_map.items():
        for i in range(len(entries)):
            for j in range(i + 1, len(entries)):
                id1, name1, ci1 = entries[i]
                id2, name2, ci2 = entries[j]
                if _time_diff_minutes(ci1, ci2) <= PROXIMITY_MINUTES:
                    key = (min(id1, id2), max(id1, id2))
                    pair_dates[key].append(d)

    seen_pairs: set[tuple[int, int]] = set()
    for (id1, id2), dates in pair_dates.items():
        if len(dates) >= MIN_OCCURRENCES and (id1, id2) not in seen_pairs:
            seen_pairs.add((id1, id2))
            s1 = db.query(Staff).filter(Staff.id == id1).first()
            s2 = db.query(Staff).filter(Staff.id == id2).first()
            flags.append({
                "type": "buddy_punch",
                "severity": "red",
                "staff_ids": [id1, id2],
                "staff_names": [s1.name, s2.name],
                "occurrences": len(dates),
                "dates": [str(d) for d in sorted(dates)],
                "message": (
                    f"{s1.name} and {s2.name} clocked in within {PROXIMITY_MINUTES} minutes "
                    f"of each other on {len(dates)} separate occasions — possible buddy-punch."
                ),
            })

    return flags


# ---------------------------------------------------------------------------
# 3. Missed-shift weekday clustering
# ---------------------------------------------------------------------------
MIN_CLUSTER_COUNT = 2


def missed_shift_flags(db: Session) -> list[dict[str, Any]]:
    """
    Flag staff whose absences (no attendance record) cluster on the same weekday
    on MIN_CLUSTER_COUNT or more occasions.

    Strategy: build the full expected work calendar (Mon–Sat) for the date range
    present in the attendance table, then find gaps per staff member.
    """
    flags = []

    # Determine overall date range from attendance records
    all_records = db.query(Attendance).all()
    if not all_records:
        return []

    all_dates = sorted({r.date for r in all_records})
    min_date = all_dates[0]
    max_date = all_dates[-1]

    # Build set of expected work days (Mon–Sat)
    expected_days: set = set()
    cur = min_date
    while cur <= max_date:
        if cur.weekday() < 6:  # 0–5 = Mon–Sat
            expected_days.add(cur)
        cur += cur.replace(day=cur.day + 1) - cur  # increment by 1 day

    staff_list = db.query(Staff).all()
    weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for s in staff_list:
        present_dates = {
            r.date for r in db.query(Attendance).filter(Attendance.staff_id == s.id).all()
        }
        absent_dates = expected_days - present_dates

        if not absent_dates:
            continue

        # Count absences by weekday
        wd_counts: dict[int, int] = defaultdict(int)
        for d in absent_dates:
            wd_counts[d.weekday()] += 1

        for wd, cnt in wd_counts.items():
            if cnt >= MIN_CLUSTER_COUNT:
                flags.append({
                    "type": "missed_shift_cluster",
                    "severity": "yellow",
                    "staff_id": s.id,
                    "staff_name": s.name,
                    "weekday": weekday_names[wd],
                    "absence_count": cnt,
                    "message": (
                        f"{s.name} has been absent on {cnt} {weekday_names[wd]}s "
                        f"— possible recurring pattern."
                    ),
                })


    return flags


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------
def compute_all_flags(db: Session) -> dict[str, Any]:
    late = late_arrival_flags(db)
    buddy = buddy_punch_flags(db)
    missed = missed_shift_flags(db)

    all_flags = late + buddy + missed
    red_count = sum(1 for f in all_flags if f["severity"] == "red")
    yellow_count = sum(1 for f in all_flags if f["severity"] == "yellow")

    return {
        "summary": {
            "total_flags": len(all_flags),
            "red": red_count,
            "yellow": yellow_count,
        },
        "flags": all_flags,
    }
