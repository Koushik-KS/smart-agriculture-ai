import os
import json
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2

# ==============================
# Configuration
# ==============================

DATASET_DIR = "../dataset/PlantVillage-Dataset/raw/color"
MODEL_DIR = "../model"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 5
SEED = 42

os.makedirs(MODEL_DIR, exist_ok=True)

# ==============================
# Load dataset
# ==============================

print("🌿 Loading PlantVillage dataset...")

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="training",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATASET_DIR,
    validation_split=0.2,
    subset="validation",
    seed=SEED,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
)

class_names = train_ds.class_names
num_classes = len(class_names)

print(f"\nNumber of classes: {num_classes}")
print("Classes:")

for i, class_name in enumerate(class_names):
    print(f"{i}: {class_name}")

# ==============================
# Save class names
# ==============================

with open(
    os.path.join(MODEL_DIR, "class_names.json"),
    "w",
    encoding="utf-8",
) as file:
    json.dump(class_names, file, indent=2)

# ==============================
# Improve data pipeline
# ==============================

AUTOTUNE = tf.data.AUTOTUNE

train_ds = train_ds.prefetch(AUTOTUNE)
val_ds = val_ds.prefetch(AUTOTUNE)

# ==============================
# Data augmentation
# ==============================

data_augmentation = keras.Sequential(
    [
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
    ],
    name="data_augmentation",
)

# ==============================
# Transfer learning model
# ==============================

print("\n🤖 Building MobileNetV2 model...")

base_model = MobileNetV2(
    input_shape=IMG_SIZE + (3,),
    include_top=False,
    weights="imagenet",
)

base_model.trainable = False

inputs = keras.Input(shape=IMG_SIZE + (3,))

x = data_augmentation(inputs)

x = keras.applications.mobilenet_v2.preprocess_input(x)

x = base_model(x, training=False)

x = layers.GlobalAveragePooling2D()(x)

x = layers.Dropout(0.2)(x)

outputs = layers.Dense(
    num_classes,
    activation="softmax",
)(x)

model = keras.Model(inputs, outputs)

# ==============================
# Compile
# ==============================

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

model.summary()

# ==============================
# Train
# ==============================

print("\n🚀 Starting training...")

history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=EPOCHS,
)

# ==============================
# Save model
# ==============================

model_path = os.path.join(
    MODEL_DIR,
    "plant_disease_model.keras",
)

model.save(model_path)

print("\n✅ Training complete!")
print(f"Model saved to: {model_path}")
print(
    f"Final validation accuracy: "
    f"{history.history['val_accuracy'][-1] * 100:.2f}%"
)