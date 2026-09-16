from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="Smart Agriculture AI - Recommendation Engine",
    description="Combines AI predictions into agricultural recommendations",
    version="1.0.0",
)


class RecommendationInput(BaseModel):
    recommended_crop: str
    crop_confidence: float = Field(..., ge=0, le=100)

    predicted_disease: str | None = None
    disease_confidence: float | None = Field(
        default=None,
        ge=0,
        le=100
    )

    predicted_yield: float | None = Field(
        default=None,
        ge=0
    )


@app.get("/")
def root():
    return {
        "message": "Recommendation Engine is running"
    }


@app.post("/recommend")
def generate_recommendation(data: RecommendationInput):

    recommendations = []
    alerts = []

    # =====================================
    # Crop recommendation
    # =====================================

    if data.crop_confidence < 60:
        alerts.append(
            "Crop recommendation has low confidence. "
            "Verify soil and weather conditions before making a decision."
        )
    elif data.crop_confidence < 80:
        recommendations.append(
            "Crop recommendation has moderate confidence. "
            "Consider checking local agricultural conditions."
        )
    else:
        recommendations.append(
            f"The AI recommends {data.recommended_crop} "
            "based on the provided conditions."
        )

    # =====================================
    # Plant disease
    # =====================================

    if data.predicted_disease:
        disease = data.predicted_disease.lower()

        healthy = "healthy" in disease

        if healthy:
            recommendations.append(
                "The uploaded plant image was classified as healthy."
            )

        elif data.disease_confidence is not None:

            if data.disease_confidence >= 80:
                alerts.append(
                    f"Possible plant disease detected: "
                    f"{data.predicted_disease}. "
                    "Consider consulting a local agricultural expert "
                    "before applying treatment."
                )

            elif data.disease_confidence >= 60:
                alerts.append(
                    f"The image may indicate {data.predicted_disease}, "
                    "but confidence is moderate. "
                    "Consider obtaining another image or expert verification."
                )

            else:
                alerts.append(
                    "Plant disease prediction has low confidence. "
                    "Do not rely on this result alone."
                )

    # =====================================
    # Yield prediction
    # =====================================

    if data.predicted_yield is not None:

        if data.predicted_yield <= 0:
            alerts.append(
                "Predicted yield is very low. "
                "Check the agricultural inputs and historical data."
            )

        elif data.predicted_yield < 1:
            recommendations.append(
                "The predicted yield is below 1 tonne/hectare. "
                "Review crop management and local growing conditions."
            )

        elif data.predicted_yield < 3:
            recommendations.append(
                "The predicted yield is in a moderate range. "
                "Continue monitoring crop and field conditions."
            )

        else:
            recommendations.append(
                "The predicted yield is relatively high based on "
                "the supplied historical information."
            )

    # =====================================
    # Overall recommendation
    # =====================================

    if alerts:
        overall_status = "attention_required"
    else:
        overall_status = "normal"

    return {
        "recommended_crop": data.recommended_crop,
        "crop_confidence": round(data.crop_confidence, 2),
        "predicted_disease": data.predicted_disease,
        "disease_confidence": (
            round(data.disease_confidence, 2)
            if data.disease_confidence is not None
            else None
        ),
        "predicted_yield": (
            round(data.predicted_yield, 4)
            if data.predicted_yield is not None
            else None
        ),
        "overall_status": overall_status,
        "alerts": alerts,
        "recommendations": recommendations,
    }