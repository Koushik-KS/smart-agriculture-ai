import joblib
import pandas as pd

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="Smart Agriculture AI",
    description="AI service for crop recommendation",
    version="1.0.0"
)


# Load trained model
model = joblib.load("model/crop_recommendation_model.pkl")


# Input validation
class CropInput(BaseModel):
    N: float = Field(..., ge=0, le=140)
    P: float = Field(..., ge=5, le=145)
    K: float = Field(..., ge=5, le=205)

    temperature: float = Field(..., ge=8.8, le=43.7)
    humidity: float = Field(..., ge=14.3, le=100)
    ph: float = Field(..., ge=3.5, le=10)
    rainfall: float = Field(..., ge=20.2, le=298.6)


@app.get("/")
def root():
    return {
        "message": "Smart Agriculture AI API is running"
    }


@app.get("/model-status")
def model_status():
    return {
        "model": "Random Forest",
        "status": "loaded"
    }


@app.post("/predict")
def predict_crop(data: CropInput):

    input_data = pd.DataFrame([{
        "N": data.N,
        "P": data.P,
        "K": data.K,
        "temperature": data.temperature,
        "humidity": data.humidity,
        "ph": data.ph,
        "rainfall": data.rainfall
    }])

    prediction = model.predict(input_data)[0]

    probabilities = model.predict_proba(input_data)[0]
    confidence = probabilities.max() * 100

    return {
        "recommended_crop": prediction,
        "confidence": round(confidence, 2)
    }