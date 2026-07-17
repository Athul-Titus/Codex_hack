"""
OpsPilot FastAPI backend
"""

from datetime import date, time
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Staff, Attendance
from anomaly import compute_all_flags

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OpsPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class StaffOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class AttendanceIn(BaseModel):
    staff_id: int
    date: date
    check_in: Optional[time] = None
    check_out: Optional[time] = None


class AttendanceOut(BaseModel):
    id: int
    staff_id: int
    date: date
    check_in: Optional[time]
    check_out: Optional[time]

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/staff", response_model=list[StaffOut])
def list_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()


@app.post("/api/attendance", response_model=AttendanceOut)
def record_attendance(payload: AttendanceIn, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == payload.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    # Check if record already exists for this day
    existing = db.query(Attendance).filter(
        Attendance.staff_id == payload.staff_id,
        Attendance.date == payload.date,
    ).first()

    if existing:
        # Update check-out if checking out
        if payload.check_out:
            existing.check_out = payload.check_out
        db.commit()
        db.refresh(existing)
        return existing

    record = Attendance(
        staff_id=payload.staff_id,
        date=payload.date,
        check_in=payload.check_in,
        check_out=payload.check_out,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/pulse/flags")
def get_pulse_flags(db: Session = Depends(get_db)):
    """Run real anomaly detection over attendance data and return structured flags."""
    return compute_all_flags(db)


@app.get("/api/pulse/report")
def get_pulse_report():
    """
    Returns a hardcoded-but-sharp natural-language weekly ops report.
    # TODO: replace with live LLM call (NIM/Llama, structured prompt over flags JSON) tomorrow
    """
    return {
        "report": (
            "Here's your Workforce Pulse summary for the week.\n\n"
            "**Priya Menon** was late on 3 of her last 5 working days — and the pattern is clear: "
            "it's almost always Mondays. Her check-in on Monday mornings is consistently 35–50 minutes "
            "past the expected 9:30 AM. This is worth a quick, friendly conversation — it could be "
            "a commute issue, a childcare window, or just the Monday blues. A small schedule adjustment "
            "might fix it entirely.\n\n"
            "**Arun Sharma** and **Faisal Khan** clocked in within seconds of each other on 3 separate "
            "occasions this week — Monday, Wednesday, and Friday. Statistically, this is unusual. It "
            "doesn't mean anything improper is happening, but it's a pattern worth a brief, low-key "
            "in-person check. If they're carpooling, that's great — just worth knowing. If not, a quick "
            "reminder about independent check-ins is all that's needed.\n\n"
            "**Deepa Nair** has been absent every Friday for three consecutive weeks. Three weeks is "
            "enough to call it a pattern. It may be planned leave that hasn't been formally logged, "
            "or she may need support. Either way, a short conversation to understand what's going on "
            "would be valuable before it becomes a coverage problem.\n\n"
            "**Rohit Verma** had a clean week — consistent check-ins, no anomalies. Good to see.\n\n"
            "Overall: 2 red flags (late arrivals + buddy-punch signal) and 1 yellow flag (missed-shift "
            "clustering). Recommend addressing Priya and Deepa's patterns this week."
        ),
        "generated_at": "2025-07-14T09:00:00",
        "flag_count": 3,
    }


@app.get("/api/pulse/attendance")
def get_attendance(db: Session = Depends(get_db)):
    records = db.query(Attendance).all()
    return [
        {
            "id": r.id,
            "staff_id": r.staff_id,
            "staff_name": r.staff.name,
            "date": str(r.date),
            "check_in": str(r.check_in) if r.check_in else None,
            "check_out": str(r.check_out) if r.check_out else None,
        }
        for r in records
    ]


@app.get("/")
def root():
    return {"message": "OpsPilot API is running"}
