import pandas as pd
import joblib

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


# =========================
# 1. Load dataset
# =========================

DATA_PATH = "../dataset/Crop_Wise_Area_Production_Yield/crop-wise-area-production-yield.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset shape:", df.shape)


# =========================
# 2. Prepare year
# =========================

df["year_start"] = df["year"].str[:4].astype(int)


# =========================
# 3. Create previous-year yield
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


# Make sure it is actually the previous
# consecutive agricultural year
previous_year = (
    df.groupby(keys)["year_start"].shift(1)
)

df.loc[
    df["year_start"] - previous_year != 1,
    "previous_yield"
] = None


# =========================
# 4. Select required columns
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

target = "yield"

df = df[features + [target]]

df = df.dropna()

df = df[df["area"] > 0]
df = df[df["previous_yield"] >= 0]
df = df[df["yield"] >= 0]

print("Clean dataset shape:", df.shape)


# =========================
# 5. Time-based train/test split
# =========================

train = df[df["year_start"] <= 2019]
test = df[df["year_start"] >= 2020]

X_train = train[features]
y_train = train[target]

X_test = test[features]
y_test = test[target]

print("Training records:", len(X_train))
print("Testing records:", len(X_test))


# =========================
# 6. Preprocessing
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
    "area",
    "previous_yield"
]

preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            OneHotEncoder(
                handle_unknown="ignore"
            ),
            categorical_features
        ),
        (
            "num",
            "passthrough",
            numeric_features
        )
    ]
)


# =========================
# 7. Transform data
# =========================

X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)

print(
    "Processed training shape:",
    X_train_processed.shape
)


# =========================
# 8. Train Random Forest
# =========================

model = RandomForestRegressor(
    n_estimators=100,
    random_state=42,
    n_jobs=-1,
    max_depth=20,
    min_samples_leaf=2
)

print("\nTraining model...")

model.fit(
    X_train_processed,
    y_train
)


# =========================
# 9. Evaluate
# =========================

predictions = model.predict(X_test_processed)

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


print("\n===== Yield Prediction Results =====")

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")


# =========================
# 10. Save model + preprocessor
# =========================

MODEL_PATH = "../model/yield_prediction_model.pkl"

joblib.dump(
    {
        "model": model,
        "preprocessor": preprocessor,
        "features": features
    },
    MODEL_PATH
)

print("\nModel saved successfully:")
print(MODEL_PATH)