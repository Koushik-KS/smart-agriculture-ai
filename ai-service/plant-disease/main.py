import json
import numpy as np
from pathlib import Path
import tensorflow as tf

from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image
from io import BytesIO


# =========================================================
# MODEL CONFIGURATION
# =========================================================

MODEL_PATH = Path(__file__).resolve().parent / "model" / "plant_disease_model.keras"
CLASS_NAMES_PATH = Path(__file__).resolve().parent / "model" / "class_names.json"

IMG_SIZE = (224, 224)


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Smart Agriculture AI - Plant Disease API",
    description="AI service for plant disease detection using MobileNetV2",
    version="1.2.0",
)


# =========================================================
# LOAD TRAINED MODEL
# =========================================================

print("🤖 Loading plant disease model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("✅ Plant disease model loaded successfully")


# =========================================================
# LOAD CLASS NAMES
# =========================================================

with open(
    CLASS_NAMES_PATH,
    "r",
    encoding="utf-8"
) as file:

    class_names = json.load(file)


print("✅ Class names loaded successfully")
print(f"🌿 Number of classes: {len(class_names)}")


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "Plant Disease AI API is running"
    }


# =========================================================
# MODEL STATUS
# =========================================================

@app.get("/model-status")
def model_status():

    return {
        "model": "MobileNetV2",
        "classes": len(class_names),
        "status": "loaded"
    }


# =========================================================
# PLANT DISEASE PREDICTION
# =========================================================

@app.post("/predict")
async def predict_disease(
    file: UploadFile = File(...)
):

    # -----------------------------------------------------
    # FILE VALIDATION
    # -----------------------------------------------------

    if (
        not file.content_type
        or not file.content_type.startswith("image/")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )


    try:

        # -------------------------------------------------
        # READ IMAGE
        # -------------------------------------------------

        image_bytes = await file.read()


        if not image_bytes:

            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )


        # -------------------------------------------------
        # OPEN IMAGE
        # -------------------------------------------------

        image = Image.open(
            BytesIO(image_bytes)
        ).convert("RGB")


        # -------------------------------------------------
        # RESIZE IMAGE
        # -------------------------------------------------

        image = image.resize(
            IMG_SIZE
        )


        # -------------------------------------------------
        # CONVERT IMAGE TO NUMPY ARRAY
        # -------------------------------------------------

        image_array = np.array(
            image,
            dtype=np.float32
        )


        # -------------------------------------------------
        # ADD BATCH DIMENSION
        # -------------------------------------------------

        image_array = np.expand_dims(
            image_array,
            axis=0
        )


        # -------------------------------------------------
        # MODEL PREDICTION
        # -------------------------------------------------

        predictions = model.predict(
            image_array,
            verbose=0
        )[0]


        # =================================================
        # TOP 3 DISEASE PREDICTIONS
        # =================================================

        top_indices = (
            predictions
            .argsort()[-3:][::-1]
        )


        top_predictions = []


        for index in top_indices:

            top_predictions.append({

                "disease":
                    class_names[int(index)],

                "confidence":
                    round(
                        float(
                            predictions[index] * 100
                        ),
                        2
                    )

            })


        # =================================================
        # BEST PREDICTION
        # =================================================

        predicted_index = int(
            top_indices[0]
        )


        confidence = float(
            predictions[predicted_index] * 100
        )


        predicted_class = (
            class_names[predicted_index]
        )


        # =================================================
        # CONFIDENCE LEVEL
        # =================================================

        if confidence < 60:

            confidence_level = "low"

        elif confidence < 80:

            confidence_level = "moderate"

        else:

            confidence_level = "high"


        # =================================================
        # FINAL RESPONSE
        # =================================================

        return {

            "predicted_disease":
                predicted_class,

            "confidence":
                round(
                    confidence,
                    2
                ),

            "confidence_level":
                confidence_level,

            "top_predictions":
                top_predictions

        }


    # =====================================================
    # ERROR HANDLING
    # =====================================================

    except HTTPException:

        raise


    except Exception as error:

        print(
            f"Prediction error: {error}"
        )


        raise HTTPException(
            status_code=500,
            detail="Failed to process the image."
        )
