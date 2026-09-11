import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix

# ==============================
# Configuration
# ==============================

DATASET_DIR = "../dataset/PlantVillage-Dataset/raw/color"
MODEL_PATH = "../model/plant_disease_model.keras"
CLASS_NAMES_PATH = "../model/class_names.json"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
SEED = 42

# ==============================
# Load model
# ==============================

print("🤖 Loading trained model...")

model = keras.models.load_model(MODEL_PATH)

print("✅ Model loaded")

# ==============================
# Load class names
# ==============================

with open(CLASS_NAMES_PATH, "r", encoding="utf-8") as file:
    class_names = json.load(file)

print(f"Number of classes: {len(class_names)}")

# ==============================
# Load validation dataset
# ==============================

print("\n🌿 Loading validation dataset...")

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    shuffle=True,
)

# ==============================
# Evaluate overall accuracy
# ==============================

print("\n📊 Evaluating model...")

loss, accuracy = model.evaluate(val_ds, verbose=1)

print("\n===================================")
print("MODEL EVALUATION")
print("===================================")
print(f"Validation Loss: {loss:.4f}")
print(f"Validation Accuracy: {accuracy * 100:.2f}%")

# ==============================
# Generate predictions
# ==============================

print("\n🔍 Generating predictions...")

y_true = []
y_pred = []

for images, labels in val_ds:
    predictions = model.predict(images, verbose=0)

    predicted_classes = np.argmax(predictions, axis=1)

    y_true.extend(labels.numpy())
    y_pred.extend(predicted_classes)

y_true = np.array(y_true)
y_pred = np.array(y_pred)

# ==============================
# Classification report
# ==============================

print("\n📋 Classification Report")
print("===================================")

report = classification_report(
    y_true,
    y_pred,
    labels=list(range(len(class_names))),
    target_names=class_names,
    digits=4,
    zero_division=0,
)

print(report)

# ==============================
# Confusion matrix
# ==============================

cm = confusion_matrix(y_true, y_pred)

print("\n🧩 Confusion Matrix")
print("===================================")
print(cm)

# ==============================
# Save evaluation report
# ==============================

report_path = "../model/disease_evaluation_report.txt"

with open(report_path, "w", encoding="utf-8") as file:
    file.write("Plant Disease Model Evaluation\n")
    file.write("===================================\n")
    file.write(f"Validation Loss: {loss:.4f}\n")
    file.write(f"Validation Accuracy: {accuracy * 100:.2f}%\n\n")
    file.write("Classification Report\n")
    file.write("===================================\n")
    file.write(report)
    file.write("\n\nConfusion Matrix\n")
    file.write("===================================\n")
    file.write(np.array2string(cm))

print(f"\n✅ Evaluation report saved to: {report_path}")