export type CropInformation = {
  crop: string;
  description: string;
  suitableSoilPh: {
    min: number;
    max: number;
  };
  suitableTemperature: {
    min: number;
    max: number;
  };
  waterRequirement: "Low" | "Moderate" | "High";
  drainage: "Good" | "Moderate" | "Poor";
};

export const cropInformation: CropInformation[] = [
  {
    crop: "Rice",
    description:
      "A major cereal crop commonly grown under irrigated or rainfed conditions.",
    suitableSoilPh: {
      min: 5.0,
      max: 7.5,
    },
    suitableTemperature: {
      min: 20,
      max: 35,
    },
    waterRequirement: "High",
    drainage: "Moderate",
  },

  {
    crop: "Jute",
    description:
      "A fibre crop suited to warm and humid growing conditions.",
    suitableSoilPh: {
      min: 5.0,
      max: 7.5,
    },
    suitableTemperature: {
      min: 24,
      max: 37,
    },
    waterRequirement: "High",
    drainage: "Moderate",
  },

  {
    crop: "Papaya",
    description:
      "A tropical fruit crop that requires warm conditions and well-drained soil.",
    suitableSoilPh: {
      min: 6.0,
      max: 7.5,
    },
    suitableTemperature: {
      min: 22,
      max: 35,
    },
    waterRequirement: "Moderate",
    drainage: "Good",
  },
];