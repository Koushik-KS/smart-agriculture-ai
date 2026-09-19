import joblib
import pandas as pd
from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel, Field


MODEL_PATH = Path(__file__).resolve().parent / "model" / "yield_prediction_model.pkl"


app = FastAPI(
    title="Smart Agriculture AI - Yield Prediction API",
    description="AI service for crop yield prediction",
    version="1.0.0"
)


print("🤖 Loading yield prediction model...")

saved = joblib.load(MODEL_PATH)

model = saved["model"]
preprocessor = saved["preprocessor"]

print("✅ Yield prediction model loaded successfully")


class YieldInput(BaseModel):
    year_start: int = Field(..., ge=1997, le=2030)
    state_name: str
    district_name: str
    crop_name: str
    crop_type: str
    season: str
    area: float = Field(..., gt=0)
    previous_yield: float = Field(..., ge=0)


@app.get("/")
def root():
    return {
        "message": "Yield Prediction AI API is running"
    }


@app.get("/model-status")
def model_status():
    return {
        "model": "Random Forest Regressor",
        "status": "loaded"
    }


@app.post("/predict")
def predict_yield(data: YieldInput):

    input_data = pd.DataFrame([{
        "year_start": data.year_start,
        "state_name": data.state_name,
        "district_name": data.district_name,
        "crop_name": data.crop_name,
        "crop_type": data.crop_type,
        "season": data.season,
        "area": data.area,
        "previous_yield": data.previous_yield
    }])

    input_processed = preprocessor.transform(input_data)

    prediction = model.predict(input_processed)[0]

    prediction = max(0, float(prediction))

    return {
        "predicted_yield": round(prediction, 4),
        "yield_unit": "Tonnes/Hectare"
    }
