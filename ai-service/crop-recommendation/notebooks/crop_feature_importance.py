import joblib
import pandas as pd

MODEL_PATH = "../model/crop_recommendation_model.pkl"

print("Loading crop recommendation model...")

model = joblib.load(MODEL_PATH)

print("Model:", type(model).__name__)

feature_names = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall"
]

importance = model.feature_importances_

result = pd.DataFrame({
    "feature": feature_names,
    "importance": importance
})

result = result.sort_values(
    by="importance",
    ascending=False
).reset_index(drop=True)

result["importance_percent"] = (
    result["importance"] * 100
).round(2)

print("\nFeature Importance:")
print(
    result[
        ["feature", "importance_percent"]
    ].to_string(index=False)
)