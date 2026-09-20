# Smart Agriculture AI

A Machine Learning and AI project developed as part of my B.E. Artificial Intelligence and Machine Learning learning journey.

The goal of this project was to build a practical machine learning application rather than only training a model. The project combines multiple AI/ML techniques with a full-stack web application to create an intelligent agriculture platform.

## Live Demo

https://smart-agriculture-ai-pi.vercel.app/

## Project Overview

Smart Agriculture AI combines different machine learning and AI modules to support agricultural decision-making.

The project includes:

- Crop Recommendation
- Plant Disease Detection
- Yield Prediction
- Recommendation Engine
- Weather Integration
- Complete AI Farm Analysis

## Machine Learning Work

This project focuses on applying concepts from Artificial Intelligence and Machine Learning, including:

- Data preprocessing
- Exploratory data analysis
- Feature analysis
- Classification
- Regression
- Model comparison
- Model evaluation
- Cross-validation
- Transfer learning
- Computer vision
- Prediction confidence
- Feature importance
- Model deployment

Different models and approaches were studied and tested for different agricultural problems instead of using a single model for every task.

## Main Modules

### Crop Recommendation

A classification model recommends suitable crops using:

- Nitrogen
- Phosphorus
- Potassium
- Temperature
- Humidity
- Soil pH
- Rainfall

The system provides the recommended crop, confidence, top predictions, and feature importance.

### Plant Disease Detection

A computer vision model using MobileNetV2 and transfer learning analyzes plant leaf images and predicts possible diseases with confidence scores.

### Yield Prediction

A regression model predicts agricultural yield using historical information such as:

- Year
- State
- District
- Crop
- Crop type
- Season
- Area
- Previous-year yield

### Recommendation Engine

The outputs from the different AI models are combined to generate alerts and recommendations based on the available agricultural information.

### Weather Integration

Weather information is retrieved based on the selected state and district and can be used as part of the agricultural analysis.

## Complete AI Workflow

```text
Agricultural Data
       ↓
Machine Learning Models
       ↓
Crop Recommendation
       ↓
Plant Disease Detection
       ↓
Yield Prediction
       ↓
Weather Information
       ↓
Recommendation Engine
       ↓
Complete AI Farm Analysis
