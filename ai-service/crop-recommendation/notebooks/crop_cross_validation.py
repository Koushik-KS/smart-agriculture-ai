import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score


# Load dataset
df = pd.read_csv("dataset/Crop_Recommendation.csv")

X = df.drop("label", axis=1)
y = df["label"]


# Random Forest model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42
)


# 5-fold stratified cross-validation
cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)


scores = cross_val_score(
    model,
    X,
    y,
    cv=cv,
    scoring="accuracy"
)


print("🌾 Random Forest - 5-Fold Cross Validation")
print("-------------------------------------------")

for i, score in enumerate(scores, start=1):
    print(f"Fold {i} Accuracy: {score:.4f} ({score * 100:.2f}%)")


print("-------------------------------------------")
print(f"Mean Accuracy: {scores.mean():.4f} ({scores.mean() * 100:.2f}%)")
print(f"Standard Deviation: {scores.std():.4f}")