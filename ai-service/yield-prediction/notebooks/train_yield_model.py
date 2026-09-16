import os
import numpy as np
import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline


# =========================
# 1. Paths
# =========================

DATASET_PATH = (
    "ai-service/yield-prediction/"
    "dataset/Crop_Wise_Area_Production_Yield/"
    "crop-wise-area-production-yield.csv"
)

MODEL_DIR = "ai-service/yield-prediction/model"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "yield_prediction_model.pkl"
)


# =========================
# 2. Load dataset
# =========================

print("Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset shape: {df.shape}")


# =========================
# 3. Select features
# =========================

features = [
    "year",
    "state_name",
    "district_name",
    "crop_name",
    "crop_type",
    "season",
    "area"
]

target = "yield"

df = df[features + [target]].copy()


# =========================
# 4. Convert year
# =========================

df["year_start"] = (
    df["year"]
    .str[:4]
    .astype(int)
)


# =========================
# 5. Clean data
# =========================

df = df.dropna(
    subset=[
        "year_start",
        "state_name",
        "district_name",
        "crop_name",
        "crop_type",
        "season",
        "area",
        "yield"
    ]
)

df = df[df["area"] > 0]

df = df[df["yield"] >= 0]


# =========================
# 6. Remove original year
# =========================

df.drop(
    columns=["year"],
    inplace=True
)


# =========================
# 7. Time-based split
# =========================

train_df = df[
    df["year_start"] <= 2019
]

test_df = df[
    df["year_start"] >= 2020
]

print(
    f"Training records: {len(train_df)}"
)

print(
    f"Testing records : {len(test_df)}"
)


# =========================
# 8. Separate X and y
# =========================

X_train = train_df.drop(
    columns=[target]
)

y_train = train_df[target]

X_test = test_df.drop(
    columns=[target]
)

y_test = test_df[target]


# =========================
# 9. Log-transform target
# =========================

print("Applying log transformation to yield...")

y_train_log = np.log1p(y_train)


# =========================
# 10. Feature types
# =========================

categorical_features = [
    "state_name",
    "district_name",
    "crop_name",
    "crop_type",
    "season"
]

numeric_features = [
    "year_start",
    "area"
]


# =========================
# 11. Preprocessing
# =========================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "categorical",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=True
            ),
            categorical_features
        ),
        (
            "numeric",
            "passthrough",
            numeric_features
        )
    ]
)


# =========================
# 12. Random Forest
# =========================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    max_depth=20,
    min_samples_leaf=2
)


# =========================
# 13. Pipeline
# =========================

pipeline = Pipeline(
    steps=[
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            model
        )
    ]
)


# =========================
# 14. Train
# =========================

print("Training Random Forest...")

pipeline.fit(
    X_train,
    y_train_log
)

print("Training completed.")


# =========================
# 15. Predict
# =========================

print("Making predictions...")

predictions_log = pipeline.predict(
    X_test
)


# Convert predictions back
# to original yield scale

predictions = np.expm1(
    predictions_log
)

predictions = np.maximum(
    predictions,
    0
)


# =========================
# 16. Evaluation
# =========================

mae = mean_absolute_error(
    y_test,
    predictions
)

rmse = mean_squared_error(
    y_test,
    predictions
) ** 0.5

r2 = r2_score(
    y_test,
    predictions
)


# =========================
# 17. Display results
# =========================

print("\n===== LOG-TRANSFORMED MODEL RESULTS =====")

print(
    f"MAE  : {mae:.4f}"
)

print(
    f"RMSE : {rmse:.4f}"
)

print(
    f"R²   : {r2:.4f}"
)


# =========================
# 18. Save model
# =========================

os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

joblib.dump(
    pipeline,
    MODEL_PATH
)

print(
    f"\nModel saved to: {MODEL_PATH}"
)