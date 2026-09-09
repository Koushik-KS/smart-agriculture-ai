import joblib
import pandas as pd


# Load trained model
model = joblib.load("model/crop_recommendation_model.pkl")


def get_value(name, min_value, max_value):
    while True:
        try:
            value = float(input(f"Enter {name}: "))

            if min_value <= value <= max_value:
                return value

            print(
                f"❌ Invalid value. {name} must be between "
                f"{min_value} and {max_value}."
            )

        except ValueError:
            print("❌ Please enter a valid number.")


print("🌾 Smart Agriculture - Crop Recommendation")
print("-------------------------------------------")

N = get_value("Nitrogen (N)", 0, 140)
P = get_value("Phosphorus (P)", 5, 145)
K = get_value("Potassium (K)", 5, 205)

temperature = get_value("Temperature", 8.8, 43.7)
humidity = get_value("Humidity", 14.3, 100)
ph = get_value("Soil pH", 3.5, 10)
rainfall = get_value("Rainfall", 20.2, 298.6)


# Create input DataFrame
input_data = pd.DataFrame([{
    "N": N,
    "P": P,
    "K": K,
    "temperature": temperature,
    "humidity": humidity,
    "ph": ph,
    "rainfall": rainfall
}])


# Prediction
prediction = model.predict(input_data)[0]

# Probability
probabilities = model.predict_proba(input_data)[0]
confidence = probabilities.max() * 100


print("\n🌱 RESULT")
print("-------------------------------------------")
print("Recommended Crop:", prediction)
print(f"Confidence: {confidence:.2f}%")


# Confidence warning
if confidence < 60:
    print("⚠️ Low confidence prediction.")
    print("Consider checking the soil and environmental values.")
elif confidence < 80:
    print("⚠️ Moderate confidence prediction.")
else:
    print("✅ High confidence prediction.")