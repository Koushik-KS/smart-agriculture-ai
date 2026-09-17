import joblib
import pandas as pd

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="Smart Agriculture AI",
    description="AI service for crop recommendation",
    version="1.2.0"
)


# =========================================================
# LOAD TRAINED MODEL
# =========================================================

model = joblib.load(
    "model/crop_recommendation_model.pkl"
)


# =========================================================
# FEATURE NAMES
# =========================================================

FEATURE_NAMES = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall"
]


# =========================================================
# INPUT VALIDATION
# =========================================================

class CropInput(BaseModel):

    N: float = Field(
        ...,
        ge=0,
        le=140
    )

    P: float = Field(
        ...,
        ge=5,
        le=145
    )

    K: float = Field(
        ...,
        ge=5,
        le=205
    )

    temperature: float = Field(
        ...,
        ge=8.8,
        le=43.7
    )

    humidity: float = Field(
        ...,
        ge=14.3,
        le=100
    )

    ph: float = Field(
        ...,
        ge=3.5,
        le=10
    )

    rainfall: float = Field(
        ...,
        ge=20.2,
        le=298.6
    )


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message":
            "Smart Agriculture AI API is running"
    }


# =========================================================
# MODEL STATUS
# =========================================================

@app.get("/model-status")
def model_status():

    return {
        "model": "Random Forest",
        "status": "loaded",
        "classes": len(model.classes_),
        "features": FEATURE_NAMES
    }


# =========================================================
# CROP PREDICTION
# =========================================================

@app.post("/predict")
def predict_crop(data: CropInput):

    # -----------------------------------------------------
    # Prepare input
    # -----------------------------------------------------

    input_data = pd.DataFrame([{

        "N": data.N,

        "P": data.P,

        "K": data.K,

        "temperature":
            data.temperature,

        "humidity":
            data.humidity,

        "ph":
            data.ph,

        "rainfall":
            data.rainfall

    }])


    # -----------------------------------------------------
    # Get probabilities for all crops
    # -----------------------------------------------------

    probabilities = (
        model.predict_proba(input_data)[0]
    )


    # -----------------------------------------------------
    # Get Top 3 crops
    # -----------------------------------------------------

    top_indices = (
        probabilities
        .argsort()[-3:][::-1]
    )


    top_recommendations = []

    for index in top_indices:

        top_recommendations.append({

            "crop":
                str(model.classes_[index]),

            "confidence":
                round(
                    float(
                        probabilities[index] * 100
                    ),
                    2
                )

        })


    # -----------------------------------------------------
    # Best crop
    # -----------------------------------------------------

    recommended_crop = (
        top_recommendations[0]["crop"]
    )

    confidence = (
        top_recommendations[0]["confidence"]
    )


    # -----------------------------------------------------
    # Confidence level
    # -----------------------------------------------------

    if confidence < 60:

        confidence_level = "low"

        message = (
            "Low confidence prediction. "
            "Consider checking the input conditions."
        )

    elif confidence < 80:

        confidence_level = "moderate"

        message = (
            "Moderate confidence prediction."
        )

    else:

        confidence_level = "high"

        message = (
            "High confidence prediction."
        )


    # -----------------------------------------------------
    # Feature Importance
    # -----------------------------------------------------

    feature_importance = []

    for feature, importance in zip(
        FEATURE_NAMES,
        model.feature_importances_
    ):

        feature_importance.append({

            "feature":
                feature,

            "importance":
                round(
                    float(importance) * 100,
                    2
                )

        })


    # -----------------------------------------------------
    # Sort feature importance
    # Highest importance first
    # -----------------------------------------------------

    feature_importance.sort(
        key=lambda x: x["importance"],
        reverse=True
    )


    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    return {

        "recommended_crop":
            recommended_crop,

        "confidence":
            confidence,

        "confidence_level":
            confidence_level,

        "message":
            message,

        "top_recommendations":
            top_recommendations,

        "feature_importance":
            feature_importance

    }