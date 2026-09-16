from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="Smart Agriculture AI - Recommendation Engine",
    description="Combines AI predictions into agricultural recommendations",
    version="1.1.0",
)


class RecommendationInput(BaseModel):
    recommended_crop: str
    crop_confidence: float = Field(..., ge=0, le=100)

    # User-selected crop used for consistency checking
    selected_crop: str | None = None

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


def normalize_crop_name(crop: str) -> str:
    """
    Converts different crop naming formats into
    a common comparison format.
    """

    crop = crop.lower().strip()

    crop = crop.replace("_", " ")
    crop = crop.replace("-", " ")

    crop = " ".join(crop.split())

    # Common dataset naming
    crop_aliases = {
        "pepper bell": "pepper",
        "pepper bell pepper": "pepper",
        "corn": "corn",
        "maize": "corn",
    }

    return crop_aliases.get(crop, crop)


def extract_disease_crop(disease: str) -> str | None:
    """
    Extracts the crop name from PlantVillage-style
    disease class names.

    Example:
    Apple___Apple_scab → apple
    Potato___Early_blight → potato
    Pepper__bell___healthy → pepper
    """

    if not disease:
        return None

    crop_part = disease.split("___")[0]

    crop_part = crop_part.replace("_", " ")
    crop_part = " ".join(crop_part.split())

    crop_part_lower = crop_part.lower()

    if "pepper" in crop_part_lower:
        return "pepper"

    if "corn" in crop_part_lower:
        return "corn"

    return normalize_crop_name(crop_part)


@app.get("/")
def root():
    return {
        "message": "Recommendation Engine is running"
    }


@app.get("/model-status")
def model_status():
    return {
        "model": "Rule-Based Recommendation Engine",
        "status": "loaded"
    }


@app.post("/recommend")
def generate_recommendation(
    data: RecommendationInput
):

    recommendations = []
    alerts = []

    # ---------------------------------------------------------
    # Crop recommendation confidence
    # ---------------------------------------------------------

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

    # ---------------------------------------------------------
    # Crop-Disease consistency check
    # ---------------------------------------------------------

    if (
        data.selected_crop
        and data.predicted_disease
    ):

        selected_crop = normalize_crop_name(
            data.selected_crop
        )

        disease_crop = extract_disease_crop(
            data.predicted_disease
        )

        if (
            disease_crop
            and selected_crop != disease_crop
        ):

            alerts.append(
                f"Crop mismatch detected. The selected crop is "
                f"{data.selected_crop}, but the uploaded image "
                f"appears to belong to {disease_crop.title()}."
            )

    # ---------------------------------------------------------
    # Plant disease analysis
    # ---------------------------------------------------------

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
                    f"The image may indicate "
                    f"{data.predicted_disease}, but confidence is "
                    "moderate. Consider obtaining another image "
                    "or expert verification."
                )

            else:

                alerts.append(
                    "Plant disease prediction has low confidence. "
                    "Do not rely on this result alone."
                )

    # ---------------------------------------------------------
    # Yield analysis
    # ---------------------------------------------------------

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
                "The predicted yield is relatively high based "
                "on the supplied historical information."
            )

    # ---------------------------------------------------------
    # Overall status
    # ---------------------------------------------------------

    overall_status = (
        "attention_required"
        if alerts
        else "normal"
    )

    return {
        "recommended_crop": data.recommended_crop,
        "crop_confidence": round(
            data.crop_confidence,
            2
        ),

        "selected_crop": data.selected_crop,

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