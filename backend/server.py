from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd
import json
import io
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage Configuration
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "xai-pharma"
storage_key = None

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== OBJECT STORAGE FUNCTIONS ====================
def init_storage():
    """Initialize object storage - call once at startup"""
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_KEY:
        logger.warning("EMERGENT_LLM_KEY not set - file storage disabled")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to object storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    """Download file from object storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ==================== PYDANTIC MODELS ====================
class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    email: Optional[str] = None
    phone: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    predictions: List[Dict] = []

class PredictionInput(BaseModel):
    patient_id: str
    gene_data: Dict[str, float]

class PredictionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    disease_predictions: Dict[str, float]
    drug_responses: Dict[str, str]
    shap_values: Dict[str, float]
    recommendations: List[str]
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScheduleEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    date: str
    time: str
    type: str
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ScheduleEventCreate(BaseModel):
    title: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    date: str
    time: str
    type: str
    notes: Optional[str] = None

class FileRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    storage_path: str
    original_filename: str
    content_type: str
    size: int
    is_deleted: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ==================== ML MODEL SIMULATION ====================
# Simulated AI model for multi-disease prediction
DISEASES = ["Cancer", "Diabetes", "Heart Disease", "Alzheimer's", "Hypertension"]
DRUGS = ["Metformin", "Lisinopril", "Atorvastatin", "Aspirin", "Omeprazole"]
GENES = [f"GENE_{i}" for i in range(1, 51)]

def simulate_disease_prediction(gene_data: Dict[str, float], age: int, gender: str) -> Dict[str, float]:
    """Simulate multi-disease prediction based on gene data"""
    np.random.seed(hash(str(gene_data)) % 2**32)
    base_risks = {
        "Cancer": 0.15 + (age / 200),
        "Diabetes": 0.12 + (age / 250),
        "Heart Disease": 0.18 + (age / 180),
        "Alzheimer's": 0.08 + (age / 300),
        "Hypertension": 0.20 + (age / 150)
    }
    # Adjust based on gene expression levels
    gene_values = list(gene_data.values())[:10] if gene_data else [0.5] * 10
    gene_factor = np.mean(gene_values) if gene_values else 0.5
    
    predictions = {}
    for disease, base in base_risks.items():
        noise = np.random.uniform(-0.1, 0.1)
        risk = min(max(base + (gene_factor * 0.3) + noise, 0.01), 0.95)
        predictions[disease] = round(risk * 100, 1)
    return predictions

def simulate_drug_response(gene_data: Dict[str, float], disease_risks: Dict[str, float]) -> Dict[str, str]:
    """Simulate drug response prediction"""
    np.random.seed(hash(str(disease_risks)) % 2**32)
    responses = {}
    for drug in DRUGS:
        effectiveness = np.random.random()
        if effectiveness > 0.4:
            responses[drug] = "Effective"
        else:
            responses[drug] = "Not Recommended"
    return responses

def simulate_shap_values(gene_data: Dict[str, float]) -> Dict[str, float]:
    """Simulate SHAP values for explainability"""
    np.random.seed(hash(str(gene_data)) % 2**32)
    genes = list(gene_data.keys())[:20] if gene_data else GENES[:20]
    shap_values = {}
    for gene in genes:
        shap_values[gene] = round(np.random.uniform(-0.5, 0.5), 3)
    return dict(sorted(shap_values.items(), key=lambda x: abs(x[1]), reverse=True))

def generate_recommendations(disease_risks: Dict[str, float], drug_responses: Dict[str, str]) -> List[str]:
    """Generate personalized health recommendations"""
    recommendations = []
    
    # High risk diseases
    high_risk = [d for d, r in disease_risks.items() if r > 40]
    for disease in high_risk:
        if disease == "Cancer":
            recommendations.append("Schedule regular cancer screenings with your oncologist")
        elif disease == "Diabetes":
            recommendations.append("Monitor blood glucose levels and maintain a low-sugar diet")
        elif disease == "Heart Disease":
            recommendations.append("Implement cardiovascular exercise routine and reduce sodium intake")
        elif disease == "Alzheimer's":
            recommendations.append("Engage in cognitive exercises and maintain social connections")
        elif disease == "Hypertension":
            recommendations.append("Reduce stress levels and monitor blood pressure regularly")
    
    # Drug recommendations
    effective_drugs = [d for d, r in drug_responses.items() if r == "Effective"]
    if effective_drugs:
        recommendations.append(f"Consider consulting about: {', '.join(effective_drugs[:3])}")
    
    # General recommendations
    recommendations.extend([
        "Maintain a balanced diet rich in vegetables and lean proteins",
        "Exercise at least 150 minutes per week",
        "Get 7-8 hours of quality sleep each night"
    ])
    
    return recommendations[:6]

# ==================== API ROUTES ====================
@api_router.get("/")
async def root():
    return {"message": "XAI Pharma Healthcare API", "status": "healthy"}

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    patients_count = await db.patients.count_documents({})
    predictions_count = await db.predictions.count_documents({})
    files_count = await db.files.count_documents({"is_deleted": False})
    
    # Get recent predictions for trend data
    recent_predictions = await db.predictions.find(
        {}, {"_id": 0, "disease_predictions": 1, "created_at": 1}
    ).sort("created_at", -1).limit(30).to_list(30)
    
    # Calculate average risks
    avg_risks = {d: 0 for d in DISEASES}
    if recent_predictions:
        for pred in recent_predictions:
            for disease, risk in pred.get("disease_predictions", {}).items():
                if disease in avg_risks:
                    avg_risks[disease] += risk
        for disease in avg_risks:
            avg_risks[disease] = round(avg_risks[disease] / len(recent_predictions), 1)
    
    return {
        "total_patients": patients_count,
        "total_predictions": predictions_count,
        "total_files": files_count,
        "average_risks": avg_risks,
        "recent_predictions": recent_predictions[:10]
    }

# Patient Routes
@api_router.get("/patients", response_model=List[Patient])
async def get_patients():
    patients = await db.patients.find({}, {"_id": 0}).to_list(1000)
    return patients

@api_router.get("/patients/{patient_id}")
async def get_patient(patient_id: str):
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Get patient predictions
    predictions = await db.predictions.find(
        {"patient_id": patient_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    patient["predictions"] = predictions
    return patient

@api_router.post("/patients", response_model=Patient)
async def create_patient(patient: PatientCreate):
    patient_obj = Patient(**patient.model_dump())
    doc = patient_obj.model_dump()
    await db.patients.insert_one(doc)
    return patient_obj

@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    result = await db.patients.delete_one({"id": patient_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Also delete associated predictions
    await db.predictions.delete_many({"patient_id": patient_id})
    return {"message": "Patient deleted successfully"}

# Prediction Routes
@api_router.post("/predict")
async def run_prediction(input_data: PredictionInput):
    # Get patient info
    patient = await db.patients.find_one({"id": input_data.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Run predictions
    disease_predictions = simulate_disease_prediction(
        input_data.gene_data, 
        patient.get("age", 50),
        patient.get("gender", "Unknown")
    )
    drug_responses = simulate_drug_response(input_data.gene_data, disease_predictions)
    shap_values = simulate_shap_values(input_data.gene_data)
    recommendations = generate_recommendations(disease_predictions, drug_responses)
    
    # Create prediction result
    prediction = PredictionResult(
        patient_id=input_data.patient_id,
        disease_predictions=disease_predictions,
        drug_responses=drug_responses,
        shap_values=shap_values,
        recommendations=recommendations
    )
    
    # Save to database
    doc = prediction.model_dump()
    await db.predictions.insert_one(doc)
    
    return prediction

@api_router.get("/predictions")
async def get_all_predictions():
    predictions = await db.predictions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return predictions

@api_router.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    prediction = await db.predictions.find_one({"id": prediction_id}, {"_id": 0})
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction

# File Upload Routes
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    content = await file.read()
    
    # Parse CSV to validate
    try:
        df = pd.read_csv(io.BytesIO(content))
        rows_count = len(df)
        columns = list(df.columns)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
    
    # Upload to object storage
    file_id = str(uuid.uuid4())
    ext = file.filename.split(".")[-1] if "." in file.filename else "csv"
    storage_path = f"{APP_NAME}/uploads/{file_id}.{ext}"
    
    try:
        result = put_object(storage_path, content, "text/csv")
        
        # Save file record to database
        file_record = FileRecord(
            id=file_id,
            storage_path=result["path"],
            original_filename=file.filename,
            content_type="text/csv",
            size=result["size"]
        )
        await db.files.insert_one(file_record.model_dump())
        
        return {
            "id": file_id,
            "filename": file.filename,
            "rows": rows_count,
            "columns": columns,
            "size": result["size"],
            "storage_path": result["path"]
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        # Fallback: save locally if storage fails
        local_path = ROOT_DIR / "data" / f"{file_id}.csv"
        local_path.parent.mkdir(exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(content)
        
        file_record = FileRecord(
            id=file_id,
            storage_path=str(local_path),
            original_filename=file.filename,
            content_type="text/csv",
            size=len(content)
        )
        await db.files.insert_one(file_record.model_dump())
        
        return {
            "id": file_id,
            "filename": file.filename,
            "rows": rows_count,
            "columns": columns,
            "size": len(content),
            "storage_path": str(local_path),
            "storage_type": "local"
        }

@api_router.get("/files")
async def get_files():
    files = await db.files.find({"is_deleted": False}, {"_id": 0}).to_list(100)
    return files

@api_router.get("/files/{file_id}/download")
async def download_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data, content_type = get_object(record["storage_path"])
        return Response(
            content=data,
            media_type=record.get("content_type", content_type),
            headers={"Content-Disposition": f"attachment; filename={record['original_filename']}"}
        )
    except Exception as e:
        # Try local fallback
        local_path = Path(record["storage_path"])
        if local_path.exists():
            with open(local_path, "rb") as f:
                return Response(
                    content=f.read(),
                    media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={record['original_filename']}"}
                )
        raise HTTPException(status_code=404, detail="File not found in storage")

@api_router.post("/files/{file_id}/process")
async def process_csv_file(file_id: str, patient_id: str):
    """Process uploaded CSV and run predictions for a patient"""
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    patient = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    try:
        data, _ = get_object(record["storage_path"])
        df = pd.read_csv(io.BytesIO(data))
    except:
        local_path = Path(record["storage_path"])
        if local_path.exists():
            df = pd.read_csv(local_path)
        else:
            raise HTTPException(status_code=404, detail="Cannot read file")
    
    # Extract gene data from CSV (assuming first row)
    gene_columns = [col for col in df.columns if col.startswith('GENE_') or col.startswith('gene')]
    if not gene_columns:
        gene_columns = [col for col in df.columns if col not in ['age', 'gender', 'label', 'patient_id']]
    
    gene_data = {}
    if len(df) > 0:
        for col in gene_columns[:50]:
            try:
                gene_data[col] = float(df.iloc[0][col])
            except:
                gene_data[col] = 0.5
    
    # Run prediction
    prediction_input = PredictionInput(patient_id=patient_id, gene_data=gene_data)
    return await run_prediction(prediction_input)

# Schedule Routes
@api_router.get("/schedule")
async def get_schedule():
    events = await db.schedule.find({}, {"_id": 0}).sort("date", 1).to_list(1000)
    return events

@api_router.post("/schedule", response_model=ScheduleEvent)
async def create_schedule_event(event: ScheduleEventCreate):
    event_obj = ScheduleEvent(**event.model_dump())
    await db.schedule.insert_one(event_obj.model_dump())
    return event_obj

@api_router.delete("/schedule/{event_id}")
async def delete_schedule_event(event_id: str):
    result = await db.schedule.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}

# Reports Routes
@api_router.get("/reports")
async def get_reports():
    """Get aggregated report data"""
    predictions = await db.predictions.find({}, {"_id": 0}).to_list(1000)
    patients = await db.patients.find({}, {"_id": 0}).to_list(1000)
    
    # Calculate aggregate stats
    disease_stats = {d: {"total": 0, "high_risk": 0} for d in DISEASES}
    drug_stats = {d: {"effective": 0, "not_recommended": 0} for d in DRUGS}
    
    for pred in predictions:
        for disease, risk in pred.get("disease_predictions", {}).items():
            if disease in disease_stats:
                disease_stats[disease]["total"] += 1
                if risk > 50:
                    disease_stats[disease]["high_risk"] += 1
        
        for drug, response in pred.get("drug_responses", {}).items():
            if drug in drug_stats:
                if response == "Effective":
                    drug_stats[drug]["effective"] += 1
                else:
                    drug_stats[drug]["not_recommended"] += 1
    
    return {
        "total_predictions": len(predictions),
        "total_patients": len(patients),
        "disease_stats": disease_stats,
        "drug_stats": drug_stats,
        "recent_predictions": predictions[:10]
    }

# Sample Data Initialization
@api_router.post("/init-sample-data")
async def init_sample_data():
    """Initialize sample patients and predictions for demo"""
    # Check if data already exists
    existing = await db.patients.count_documents({})
    if existing > 0:
        return {"message": "Sample data already exists", "patients": existing}
    
    # Sample patients
    sample_patients = [
        {"name": "John Smith", "age": 45, "gender": "Male", "email": "john.smith@email.com", "phone": "555-0101"},
        {"name": "Sarah Johnson", "age": 38, "gender": "Female", "email": "sarah.j@email.com", "phone": "555-0102"},
        {"name": "Michael Brown", "age": 62, "gender": "Male", "email": "m.brown@email.com", "phone": "555-0103"},
        {"name": "Emily Davis", "age": 29, "gender": "Female", "email": "emily.d@email.com", "phone": "555-0104"},
        {"name": "Robert Wilson", "age": 55, "gender": "Male", "email": "r.wilson@email.com", "phone": "555-0105"},
        {"name": "Jennifer Martinez", "age": 41, "gender": "Female", "email": "j.martinez@email.com", "phone": "555-0106"},
        {"name": "David Anderson", "age": 67, "gender": "Male", "email": "d.anderson@email.com", "phone": "555-0107"},
        {"name": "Lisa Thompson", "age": 33, "gender": "Female", "email": "l.thompson@email.com", "phone": "555-0108"},
    ]
    
    created_patients = []
    for p in sample_patients:
        patient = Patient(**p)
        await db.patients.insert_one(patient.model_dump())
        created_patients.append(patient)
        
        # Create sample prediction for each patient
        gene_data = {f"GENE_{i}": np.random.uniform(0.1, 0.9) for i in range(1, 51)}
        disease_predictions = simulate_disease_prediction(gene_data, p["age"], p["gender"])
        drug_responses = simulate_drug_response(gene_data, disease_predictions)
        shap_values = simulate_shap_values(gene_data)
        recommendations = generate_recommendations(disease_predictions, drug_responses)
        
        prediction = PredictionResult(
            patient_id=patient.id,
            disease_predictions=disease_predictions,
            drug_responses=drug_responses,
            shap_values=shap_values,
            recommendations=recommendations
        )
        await db.predictions.insert_one(prediction.model_dump())
    
    # Sample schedule events
    today = datetime.now(timezone.utc)
    sample_events = [
        {"title": "Follow-up Consultation", "patient_name": "John Smith", "date": (today + timedelta(days=1)).strftime("%Y-%m-%d"), "time": "09:00", "type": "consultation"},
        {"title": "Lab Results Review", "patient_name": "Sarah Johnson", "date": (today + timedelta(days=2)).strftime("%Y-%m-%d"), "time": "14:00", "type": "review"},
        {"title": "Treatment Planning", "patient_name": "Michael Brown", "date": (today + timedelta(days=3)).strftime("%Y-%m-%d"), "time": "11:00", "type": "planning"},
        {"title": "Genetic Screening", "patient_name": "Emily Davis", "date": (today + timedelta(days=5)).strftime("%Y-%m-%d"), "time": "10:30", "type": "screening"},
    ]
    
    for event in sample_events:
        event_obj = ScheduleEvent(**event)
        await db.schedule.insert_one(event_obj.model_dump())
    
    return {"message": "Sample data created", "patients": len(created_patients)}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init failed (will use local fallback): {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
