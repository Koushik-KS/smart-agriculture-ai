import json
import numpy as np
import tensorflow as tf
from fastapi import FastAPI, File, UploadFile, HTTPException
from PIL import Image
from io import BytesIO

MODEL_PATH = "model/plant_disease_model.keras"
CLASS_NAMES_PATH = "model/class_names.json"

IMG_SIZE = (224, 224)

app = FastAPI(
    title="Smart Agriculture AI - Plant Disease API",
    description="AI service for plant disease detection using MobileNetV2",
    version="1.0.0",
)

print("🤖 Loading plant disease model...")

model = tf.keras.models.load_model(MODEL_PATH)

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
    class_names = json.load(file)

print("✅ Model loaded successfully")
print(f"🌿 Number of classes: {len(class_names)}")


@app.get("/")
def root():
    return {
        "message": "Plant Disease AI API is running"
    }


@app.get("/model-status")
def model_status():
    return {
        "model": "MobileNetV2",
        "classes": len(class_names),
        "status": "loaded"
    }


@app.post("/predict")
async def predict_disease(file: UploadFile = File(...)):

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    try:
        image_bytes = await file.read()

        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        image = image.resize(IMG_SIZE)

        image_array = np.array(image, dtype=np.float32)

        image_array = np.expand_dims(image_array, axis=0)

        predictions = model.predict(image_array, verbose=0)[0]

        predicted_index = int(np.argmax(predictions))
        confidence = float(predictions[predicted_index] * 100)

        predicted_class = class_names[predicted_index]

        if confidence < 60:
            confidence_level = "low"
        elif confidence < 80:
            confidence_level = "moderate"
        else:
            confidence_level = "high"

        return {
            "predicted_disease": predicted_class,
            "confidence": round(confidence, 2),
            "confidence_level": confidence_level
        }

    except Exception as error:
        print(f"Prediction error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Failed to process the image."
        )