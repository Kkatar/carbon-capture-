import os
import io
import json
import logging
from typing import List, Optional
from datetime import datetime, date, timedelta

from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session

import jwt
from passlib.context import CryptContext
import google.generativeai as genai
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# ==========================================
# 1. DATABASE CONFIGURATION
# ==========================================
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ecotrack.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==========================================
# 2. DATABASE MODELS
# ==========================================
class UserChallenge(Base):
    __tablename__ = "user_challenges"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), primary_key=True)
    progress = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    last_active_date = Column(String, nullable=True) # YYYY-MM-DD
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("CarbonGoal", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("Badge", back_populates="user", cascade="all, delete-orphan")

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, index=True, nullable=False) # transport, energy, food, water, recycling, shopping
    amount = Column(Float, nullable=False)
    details = Column(String, nullable=True)
    co2_produced = Column(Float, default=0.0)
    co2_saved = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="logs")

class CarbonGoal(Base):
    __tablename__ = "carbon_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String, nullable=False)
    target_reduction = Column(Float, nullable=False)
    current_reduction = Column(Float, default=0.0)
    deadline = Column(String, nullable=False) # YYYY-MM-DD
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    rarity = Column(String, nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="badges")

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    xp_reward = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 3. PYDANTIC SCHEMAS
# ==========================================
from pydantic import BaseModel, EmailStr, Field

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    xp: int
    level: int
    streak: int
    last_active_date: Optional[str] = None
    is_admin: bool
    created_at: datetime
    class Config:
        from_attributes = True

class ActivityLogCreate(BaseModel):
    category: str
    amount: float
    details: Optional[str] = None

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    details: Optional[str] = None
    co2_produced: float
    co2_saved: float
    timestamp: datetime
    class Config:
        from_attributes = True

class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    target_value: float
    xp_reward: int
    created_at: datetime
    class Config:
        from_attributes = True

class ChallengeCreate(BaseModel):
    title: str
    description: str
    category: str
    target_value: float
    xp_reward: int

class AIChatMessage(BaseModel):
    sender: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AIChatRequest(BaseModel):
    message: str
    chat_history: List[AIChatMessage] = []

class AIChatResponse(BaseModel):
    response: str
    suggestions: List[str] = []

class AIReceiptScanResponse(BaseModel):
    success: bool
    store_name: Optional[str] = None
    items: List[str] = []
    category: str
    estimated_co2: float
    sustainability_note: str

class AdminDashboardStats(BaseModel):
    total_users: int
    total_logs: int
    total_co2_saved: float
    active_challenges: int
    emissions_by_category: dict
    users_by_level: dict


# ==========================================
# 4. AUTHENTICATION & SECURITY
# ==========================================
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ecotrack_secret_key_super_secure_987654321")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required"
        )
    return current_user


# ==========================================
# 5. API ROUTERS & CONTROLLERS
# ==========================================
auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])
calc_router = APIRouter(prefix="/api/calculator", tags=["Calculator"])
tracker_router = APIRouter(prefix="/api/tracker", tags=["Tracker"])
ai_router = APIRouter(prefix="/api/ai", tags=["AI & Reports"])
game_router = APIRouter(prefix="/api/gamification", tags=["Gamification"])
admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])

# --- AUTH ROUTER ---
@auth_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    is_admin = db.query(User).count() == 0 or user_data.email == "admin@ecotrack.ai"
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        is_admin=is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@auth_router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter((User.email == form_data.username) | (User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials", headers={"WWW-Authenticate": "Bearer"})
    return {"access_token": create_access_token(data={"user_id": user.id, "username": user.username}), "token_type": "bearer"}

@auth_router.post("/oauth/{provider}", response_model=Token)
def mock_oauth(provider: str, mock_data: dict, db: Session = Depends(get_db)):
    email = mock_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="OAuth email missing")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        username = f"{mock_data.get('name', 'oauth')}_{provider}_{datetime.utcnow().strftime('%M%S')}"
        user = User(email=email, username=username, hashed_password=get_password_hash(f"{provider}_oauth_pass_99"))
        db.add(user)
        db.commit()
        db.refresh(user)
    return {"access_token": create_access_token(data={"user_id": user.id, "username": user.username}), "token_type": "bearer"}

@auth_router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# --- CALCULATOR ROUTER ---
@calc_router.post("/calculate")
def calculate_carbon_footprint(data: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    t_type = data.get("transport_type", "car_petrol")
    t_dist = float(data.get("transport_distance", 0))
    elec = float(data.get("electricity_kwh", 0))
    water = float(data.get("water_liters", 0))
    meat = data.get("meat_consumption", "moderate")
    shop = data.get("shopping_frequency", "moderate")
    recycled = float(data.get("waste_recycled", 0))

    t_factors = {"car_petrol": 0.18, "car_diesel": 0.17, "car_electric": 0.05, "motorcycle": 0.10, "bus": 0.08, "train": 0.04, "walk": 0.0, "bike": 0.0}
    transport_co2 = t_dist * t_factors.get(t_type, 0.18)
    electricity_co2 = elec * 0.4
    water_co2 = water * 0.0003

    f_factors = {"high": 300.0, "moderate": 180.0, "low": 120.0, "vegetarian": 80.0, "vegan": 45.0}
    food_co2 = f_factors.get(meat, 180.0)

    s_factors = {"high": 200.0, "moderate": 100.0, "low": 50.0, "minimal": 15.0}
    shopping_co2 = s_factors.get(shop, 100.0)
    waste_co2 = 80.0 * (1.0 - (min(recycled, 100) / 100.0) * 0.5)

    monthly_co2 = transport_co2 + electricity_co2 + water_co2 + food_co2 + shopping_co2 + waste_co2
    carbon_score = max(0, min(100, int(100 - (monthly_co2 - 100) / 14.0)))
    trees = round(monthly_co2 / 1.67, 1)
    car_km = int(monthly_co2 / 0.18)

    awarded_xp = 0
    if not db.query(Badge).filter(Badge.user_id == current_user.id, Badge.title == "First Carbon Check").first():
        db.add(Badge(user_id=current_user.id, title="First Carbon Check", description="Completed first calculation.", rarity="silver"))
        current_user.xp += 150
        awarded_xp = 150
        if current_user.xp >= current_user.level * 500:
            current_user.level += 1
        db.commit()

    return {
        "daily_co2": round(monthly_co2 / 30.4, 2), "monthly_co2": round(monthly_co2, 2), "annual_co2": round(monthly_co2 * 12, 2),
        "carbon_score": carbon_score,
        "breakdown": {"transport": round(transport_co2, 2), "electricity": round(electricity_co2, 2), "water": round(water_co2, 2), "food": round(food_co2, 2), "shopping": round(shopping_co2, 2), "waste": round(waste_co2, 2)},
        "equivalents": {"trees": trees, "car_km": car_km, "description": f"Emissions equal driving {car_km:,} km, or require {trees} trees to absorb."},
        "xp_earned": awarded_xp, "new_level": current_user.level
    }


# --- TRACKER ROUTER ---
@tracker_router.post("/log", response_model=ActivityLogResponse)
def log_activity(activity: ActivityLogCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cat = activity.category.lower()
    amt = activity.amount
    det = activity.details or ""
    co2_prod, co2_sav = 0.0, 0.0

    if cat == "transport":
        mode = det.lower()
        if mode in ["walking", "bicycling", "walk", "bike"]:
            co2_sav = amt * 0.18
        elif mode == "electric_car":
            co2_prod, co2_sav = amt * 0.05, amt * 0.13
        elif mode in ["bus", "train"]:
            f = 0.08 if mode == "bus" else 0.04
            co2_prod, co2_sav = amt * f, amt * (0.18 - f)
        else:
            co2_prod = amt * (0.25 if "flight" in mode else 0.18)
    elif cat == "energy":
        if det.lower() in ["solar", "wind", "renewable"]:
            co2_sav = amt * 0.4
        else:
            co2_prod = amt * 0.4
    elif cat == "food":
        meal = det.lower()
        if "vegan" in meal: co2_prod, co2_sav = 0.5, 2.5
        elif "vegetarian" in meal: co2_prod, co2_sav = 1.0, 2.0
        else: co2_prod = 3.0
    elif cat == "water":
        if "short" in det.lower() or "eco" in det.lower():
            co2_prod, co2_sav = amt * 0.0001, amt * 0.0002
        else:
            co2_prod = amt * 0.0003
    elif cat == "recycling":
        co2_sav = amt * 0.5
    elif cat == "shopping":
        if "second" in det.lower() or "thrift" in det.lower():
            co2_prod, co2_sav = amt * 0.1, amt * 0.9
        else:
            co2_prod = amt * 1.0
    else:
        raise HTTPException(status_code=400, detail="Invalid log category")

    new_log = ActivityLog(user_id=current_user.id, category=cat, amount=amt, details=det, co2_produced=co2_prod, co2_saved=co2_sav)
    db.add(new_log)

    # Streak & XP logic
    today_str = date.today().isoformat()
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()

    if current_user.last_active_date is None:
        current_user.streak = 1
        current_user.xp += 20
    elif current_user.last_active_date == today_str:
        current_user.xp += 20
    elif current_user.last_active_date == yesterday_str:
        current_user.streak += 1
        current_user.xp += 20 + min(current_user.streak * 5, 50)
    else:
        current_user.streak = 1
        current_user.xp += 20
        
    current_user.last_active_date = today_str

    # Badges
    streak = current_user.streak
    milestones = {3: ("Eco Explorer", "3-day streak", "emerald"), 7: ("Green Warrior", "7-day streak", "silver"), 14: ("Earth Guardian", "14-day streak", "gold")}
    if streak in milestones:
        t, d_desc, r = milestones[streak]
        if not db.query(Badge).filter(Badge.user_id == current_user.id, Badge.title == t).first():
            db.add(Badge(user_id=current_user.id, title=t, description=d_desc, rarity=r))
            current_user.xp += streak * 50

    while current_user.xp >= current_user.level * 500:
        current_user.level += 1

    # Challenges progress update
    for uc in db.query(UserChallenge).filter(UserChallenge.user_id == current_user.id, UserChallenge.is_completed == False).all():
        ch = db.query(Challenge).filter(Challenge.id == uc.challenge_id).first()
        if ch and ch.category == cat:
            uc.progress += 1.0 if cat in ["recycling", "food"] else amt
            if uc.progress >= ch.target_value:
                uc.is_completed = True
                uc.completed_at = datetime.utcnow()
                current_user.xp += ch.xp_reward

    db.commit()
    db.refresh(new_log)
    return new_log

@tracker_router.get("/logs", response_model=List[ActivityLogResponse])
def get_user_logs(limit: int = 50, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).order_by(ActivityLog.timestamp.desc()).limit(limit).all()

@tracker_router.get("/stats")
def get_user_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).all()
    total_prod = sum(l.co2_produced for l in logs)
    total_sav = sum(l.co2_saved for l in logs)
    
    breakdown = {cat: {"produced": 0.0, "saved": 0.0} for cat in ["transport", "energy", "food", "water", "recycling", "shopping"]}
    for l in logs:
        if l.category in breakdown:
            breakdown[l.category]["produced"] += l.co2_produced
            breakdown[l.category]["saved"] += l.co2_saved

    # Historical trends
    today = datetime.utcnow()
    daily_emissions = {(today - timedelta(days=i)).date().isoformat(): 0.0 for i in range(30)}
    for l in db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id, ActivityLog.timestamp >= (today - timedelta(days=30))).all():
        day_str = l.timestamp.date().isoformat()
        if day_str in daily_emissions:
            daily_emissions[day_str] += l.co2_produced
            
    trends = [{"date": k, "emissions": round(v, 2)} for k, v in sorted(daily_emissions.items())]
    recent_7 = [t["emissions"] for t in trends[-7:]]
    avg = sum(recent_7) / 7.0 if recent_7 else 0.0

    return {
        "streak": current_user.streak, "level": current_user.level, "xp": current_user.xp, "xp_needed": current_user.level * 500,
        "total_co2_produced": round(total_prod, 2), "total_co2_saved": round(total_sav, 2),
        "breakdown": breakdown, "trends": trends,
        "prediction": {"predicted_monthly": round(avg * 30, 2), "confidence_score": 85 if len(logs) > 10 else 40, "message": "Projections look optimal!"}
    }


# --- AI & REPORTS ROUTER ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def get_local_mock_ai_coach(msg: str, user: User) -> dict:
    msg_l = msg.lower()
    if "transit" in msg_l or "car" in msg_l or "travel" in msg_l:
        txt = "Swapping car trips with walks saves emissions (~0.18kg per km). Let's aim to cycle tomorrow!"
        chips = ["EV comparison", "Biking logistics"]
    elif "food" in msg_l or "diet" in msg_l:
        txt = "Adopt a vegetarian diet twice a week. Chicken and plant proteins emit 10x less than red meat."
        chips = ["Green recipes", "Local farming options"]
    else:
        txt = f"Greetings {user.username}! I am your AI climate coach. Ask me about energy, recycling, or green diets."
        chips = ["Audit my carbon footprint", "Save home utility bills"]
    return {"response": txt, "suggestions": chips}

@ai_router.post("/coach", response_model=AIChatResponse)
def coach_chat(request: AIChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel(model_name="gemini-1.5-flash", system_instruction="You are EcoTrack AI's Climate Coach. Give Markdown suggestions.")
            response = model.generate_content(request.message)
            return {"response": response.text, "suggestions": ["Give more details", "Suggest green action steps"]}
        except Exception:
            pass
    return get_local_mock_ai_coach(request.message, current_user)

@ai_router.post("/scan-receipt", response_model=AIReceiptScanResponse)
def scan_receipt(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    fn = file.filename.lower()
    if "grocery" in fn or "food" in fn:
        return {"success": True, "store_name": "Organic Greens Supermarket", "items": ["Organic Tofu x2", "Oat Milk 1L", "Veggie Burger"], "category": "food", "estimated_co2": 4.5, "sustainability_note": "Great organic selections! Oats and tofu have low carbon density."}
    return {"success": True, "store_name": "Grid Utility", "items": ["Monthly utility: 250 kWh"], "category": "energy", "estimated_co2": 100.0, "sustainability_note": "Consider shifting to solar offsets."}

@ai_router.get("/report")
def generate_sustainability_report(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).all()
    prod = sum(l.co2_produced for l in logs)
    sav = sum(l.co2_saved for l in logs)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    
    story = [
        Paragraph("EcoTrack AI | Carbon Sustainability Report", ParagraphStyle('Title', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=22, textColor=colors.HexColor('#064e3b'), spaceAfter=15)),
        Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')} | Prepared for: {current_user.username}", ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor('#5e6d68'), spaceAfter=20)),
        Paragraph("Executive Summary", ParagraphStyle('Heading', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, textColor=colors.HexColor('#10b981'), spaceAfter=10)),
        Paragraph(f"Carbon logs summary for {current_user.username}. Level: {current_user.level}, Streak: {current_user.streak} days. Produced: {round(prod, 2)} kg CO₂. Saved: {round(sav, 2)} kg CO₂.", ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14))
    ]
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=EcoTrack_Report.pdf"})


# --- GAMIFICATION ROUTER ---
def ensure_default_challenges(db: Session):
    if db.query(Challenge).count() == 0:
        db.add_all([
            Challenge(title="No Car Week", description="Walk or ride 30 km.", category="transport", target_value=30.0, xp_reward=250),
            Challenge(title="Green Eating Challenge", description="Eat 5 vegetarian meals.", category="food", target_value=5.0, xp_reward=150),
            Challenge(title="Zero Waste Sprint", description="Recycle 10 items.", category="recycling", target_value=10.0, xp_reward=200)
        ])
        db.commit()

@game_router.get("/leaderboard")
def get_leaderboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.xp.desc()).limit(5).all()
    lead = [{"rank": idx + 1, "username": u.username, "xp": u.xp, "level": u.level, "is_current_user": u.id == current_user.id} for idx, u in enumerate(users)]
    # Populate mock if database is thin
    if len(lead) < 3:
        lead.append({"rank": len(lead) + 1, "username": "EcoPioneer_Sarah", "xp": 1200, "level": 3, "is_current_user": False})
    return {"global": lead, "local": lead, "friends": [{"rank": 1, "username": current_user.username, "xp": current_user.xp, "level": current_user.level, "is_current_user": True}]}

@game_router.get("/badges")
def get_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    unlocked = {b.title: b for b in db.query(Badge).filter(Badge.user_id == current_user.id).all()}
    all_b = [
        {"title": "First Carbon Check", "description": "Completed first calculator run.", "rarity": "silver"},
        {"title": "Eco Explorer", "description": "3-day logging streak.", "rarity": "emerald"},
        {"title": "Green Warrior", "description": "7-day logging streak.", "rarity": "silver"},
        {"title": "Earth Guardian", "description": "14-day logging streak.", "rarity": "gold"}
    ]
    return [{"title": b["title"], "description": b["description"], "rarity": b["rarity"], "unlocked": b["title"] in unlocked} for b in all_b]

@game_router.get("/challenges/available")
def get_available_challenges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_default_challenges(db)
    user_ch = {uc.challenge_id: uc for uc in db.query(UserChallenge).filter(UserChallenge.user_id == current_user.id).all()}
    return [{
        "id": c.id, "title": c.title, "description": c.description, "category": c.category, "target_value": c.target_value, "xp_reward": c.xp_reward,
        "joined": c.id in user_ch, "completed": user_ch[c.id].is_completed if c.id in user_ch else False, "progress": user_ch[c.id].progress if c.id in user_ch else 0.0
    } for c in db.query(Challenge).all()]

@game_router.post("/challenges/join/{challenge_id}")
def join_challenge(challenge_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not db.query(Challenge).filter(Challenge.id == challenge_id).first():
        raise HTTPException(status_code=404, detail="Challenge missing")
    if db.query(UserChallenge).filter(UserChallenge.user_id == current_user.id, UserChallenge.challenge_id == challenge_id).first():
        raise HTTPException(status_code=400, detail="Already joined")
    db.add(UserChallenge(user_id=current_user.id, challenge_id=challenge_id))
    db.commit()
    return {"status": "success"}

@game_router.get("/certificate")
def download_certificate(current_user: User = Depends(get_current_user)):
    if current_user.level < 3:
        raise HTTPException(status_code=403, detail="Level 3 required")
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    styles = getSampleStyleSheet()
    story = [
        Paragraph("CERTIFICATE OF SUSTAINABILITY ACHIEVEMENT", ParagraphStyle('CertTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=26, textColor=colors.HexColor('#064e3b'), alignment=1, spaceAfter=20)),
        Paragraph(f"Presented to <b>{current_user.username}</b> for reaching level {current_user.level} sustainability status.", ParagraphStyle('CertBody', parent=styles['Normal'], fontSize=16, alignment=1, spaceAfter=20)),
        Paragraph(f"Date: {datetime.utcnow().strftime('%B %d, %Y')}", ParagraphStyle('CertSub', parent=styles['Normal'], fontSize=11, alignment=1))
    ]
    doc.build(story)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=Certificate.pdf"})


# --- ADMIN ROUTER ---
@admin_router.get("/stats", response_model=AdminDashboardStats)
def get_admin_stats(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    t_users = db.query(User).count()
    t_logs = db.query(ActivityLog).count()
    t_saved = sum(row[0] for row in db.query(ActivityLog.co2_saved).all() if row[0] is not None) or 0.0
    
    breakdown = {cat: 0.0 for cat in ["transport", "energy", "food", "water", "recycling", "shopping"]}
    for cat, co2 in db.query(ActivityLog.category, ActivityLog.co2_produced).all():
        if cat in breakdown: breakdown[cat] += co2 or 0.0
        
    levels = {}
    for level_tuple in db.query(User.level).all():
        lvl = str(level_tuple[0])
        levels[lvl] = levels.get(lvl, 0) + 1
        
    return {
        "total_users": t_users, "total_logs": t_logs, "total_co2_saved": round(t_saved, 2), "active_challenges": db.query(Challenge).count(),
        "emissions_by_category": {k: round(v, 2) for k, v in breakdown.items()}, "users_by_level": levels
    }

@admin_router.get("/users", response_model=List[UserResponse])
def list_users(admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).all()

@admin_router.post("/challenges", response_model=ChallengeResponse, status_code=status.HTTP_201_CREATED)
def create_challenge(challenge: ChallengeCreate, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    new_c = Challenge(title=challenge.title, description=challenge.description, category=challenge.category, target_value=challenge.target_value, xp_reward=challenge.xp_reward)
    db.add(new_c)
    db.commit()
    db.refresh(new_c)
    return new_c

@admin_router.delete("/users/{user_id}")
def delete_user(user_id: int, admin_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u or u.id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete user")
    db.delete(u)
    db.commit()
    return {"status": "success"}


# ==========================================
# 6. APP INITIALIZATION & CORS SETUP
# ==========================================
app = FastAPI(
    title="EcoTrack AI API",
    description="Consolidated backend services for carbon tracking.",
    version="1.0.0"
)

# Initialize Database tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(calc_router)
app.include_router(tracker_router)
app.include_router(ai_router)
app.include_router(game_router)
app.include_router(admin_router)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "EcoTrack AI API Server", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
