import pandas as pd
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# =========================
# 1. Load dataset
# =========================

DATA_PATH = "../dataset/Crop_Wise_Area_Production_Yield/crop-wise-area-production-yield.csv"

df = pd.read_csv(DATA_PATH)

df["year_start"] = df["year"].str[:4].astype(int)


# =========================
# 2. Create previous-year yield
# =========================

keys = [
    "state_name",
    "district_name",
    "crop_name",
    "season"
]

df = df.sort_values(keys + ["year_start"])

df["previous_yield"] = (
    df.groupby(keys)["yield"].shift(1)
)

previous_year = (
    df.groupby(keys)["year_start"].shift(1)
)

df.loc[
    df["year_start"] - previous_year != 1,
    "previous_yield"
] = None


# =========================
# 3. Prepare data
# =========================

features = [
    "year_start",
    "state_name",
    "district_name",
    "crop_name",
    "crop_type",
    "season",
    "area",
    "previous_yield"
]

df = df[features + ["yield"]]

df = df.dropna()

df = df[df["area"] > 0]
df = df[df["previous_yield"] >= 0]
df = df[df["yield"] >= 0]


# =========================
# 4. Test data
# =========================

test = df[df["year_start"] >= 2020]

X_test = test[features]
y_test = test["yield"]


# =========================
# 5. Load saved model
# =========================

MODEL_PATH = "../model/yield_prediction_model.pkl"

saved = joblib.load(MODEL_PATH)

model = saved["model"]
preprocessor = saved["preprocessor"]


# =========================
# 6. Transform test data
# =========================

X_test_processed = preprocessor.transform(X_test)


# =========================
# 7. Predict
# =========================

predictions = model.predict(X_test_processed)


# =========================
# 8. Evaluation
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


print("\n===== Saved Model Test =====")

print(f"Test records: {len(X_test)}")

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")


# =========================
# 9. Sample predictions
# =========================

results = test[
    [
        "year_start",
        "state_name",
        "district_name",
        "crop_name",
        "season",
        "area",
        "previous_yield",
        "yield"
    ]
].copy()

results["predicted_yield"] = predictions

print("\n===== Sample Predictions =====")

print(
    results.head(10).to_string(index=False)
)