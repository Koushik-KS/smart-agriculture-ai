import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# =========================
# 1. Paths
# =========================

DATASET_PATH = (
    "ai-service/yield-prediction/"
    "dataset/Crop_Wise_Area_Production_Yield/"
    "crop-wise-area-production-yield.csv"
)

MODEL_PATH = (
    "ai-service/yield-prediction/"
    "model/yield_prediction_model.pkl"
)


# =========================
# 2. Load dataset
# =========================

print("Loading dataset...")

df = pd.read_csv(DATASET_PATH)

print(f"Dataset shape: {df.shape}")


# =========================
# 3. Prepare data
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

df.drop(
    columns=["year"],
    inplace=True
)


# =========================
# 6. Select test data
# =========================

test_df = df[
    df["year_start"] >= 2020
].copy()


X_test = test_df.drop(
    columns=[target]
)

y_test = test_df[target]


# =========================
# 7. Load trained model
# =========================

print("Loading trained model...")

model = joblib.load(MODEL_PATH)

print("Model loaded successfully.")


# =========================
# 8. Predict
# =========================

print("Making predictions...")

predictions = model.predict(X_test)


# =========================
# 9. Evaluation
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


print("\n===== TEST RESULTS =====")

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
# 10. Show sample predictions
# =========================

results = test_df[
    [
        "year_start",
        "state_name",
        "district_name",
        "crop_name",
        "season",
        "area",
        "yield"
    ]
].copy()

results["predicted_yield"] = predictions

results["error"] = (
    results["yield"]
    - results["predicted_yield"]
).abs()


print("\n===== SAMPLE PREDICTIONS =====")

print(
    results.head(10).to_string(
        index=False
    )
)


# =========================
# 11. Best predictions
# =========================

print("\n===== LOWEST ERRORS =====")

print(
    results.nsmallest(
        5,
        "error"
    ).to_string(
        index=False
    )
)


# =========================
# 12. Highest errors
# =========================

print("\n===== HIGHEST ERRORS =====")

print(
    results.nlargest(
        5,
        "error"
    ).to_string(
        index=False
    )
)