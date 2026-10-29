# Phase 5 & 6 API Reference: Feature Engineering & RUL Prediction

This document details the REST APIs implemented for Phase 5 (Sliding Window Feature Extraction & Data Quality) and Phase 6 (RUL Machine Learning with Java Tribuo).

---

## 1. Feature Engineering APIs (Phase 5)

### Generate Sliding Window Features
* **POST** `/api/features/generate/{machineId}`
* **Authorization**: `ADMIN`, `ENGINEER`
* **Request Body** (optional):
```json
{
  "windowSizeSeconds": 60,
  "stepSizeSeconds": 30,
  "startTime": "2026-09-20T00:00:00Z",
  "endTime": "2026-09-20T12:00:00Z"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Features generated successfully",
  "data": {
    "machineId": 1,
    "featuresGenerated": 120,
    "windowSizeSeconds": 60,
    "stepSizeSeconds": 30,
    "message": "Generated 120 feature windows."
  }
}
```

### Get Machine Feature Windows
* **GET** `/api/machines/{id}/features?page=0&size=20`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Query Parameters**:
  * `page` (int, default 0)
  * `size` (int, default 20)
  * `startTime` (ISO-8601, optional)
  * `endTime` (ISO-8601, optional)
* **Response**: Paginated `PageResponse<MachineFeatureDto>` containing statistical aggregations:
  * `temperatureMean`, `temperatureStd`, `temperatureMax`, `temperatureTrend`
  * `vibrationMean`, `vibrationStd`, `vibrationRms`, `vibrationMax`
  * `currentMean`, `currentStd`, `currentTrend`
  * `pressureMean`, `pressureStd`, `pressureMax`
  * `rpmMean`, `rpmStd`
  * `acousticMean`, `acousticRms`, `acousticMax`

### Get Latest Feature Window
* **GET** `/api/machines/{id}/features/latest`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

### Evaluate Telemetry Data Quality
* **GET** `/api/machines/{id}/data-quality`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "machineId": 1,
    "overallScore": 0.98,
    "completeness": 0.99,
    "validity": 1.0,
    "timeliness": 0.97,
    "anomalyRatio": 0.01,
    "issuesSummary": []
  }
}
```

---

## 2. RUL Prediction & Model Registry APIs (Phase 6)

### Run RUL Prediction for Machine
* **POST** `/api/ml/predict/{machineId}`
* **Authorization**: `ADMIN`, `ENGINEER`
* **Response**:
```json
{
  "success": true,
  "message": "RUL predicted successfully",
  "data": {
    "id": 42,
    "machineId": 1,
    "predictedRulHours": 142.5,
    "confidenceLower": 128.2,
    "confidenceUpper": 156.8,
    "modelVersion": "TRIBUO_LINEAR_SGD_V1",
    "healthScore": 88.0,
    "status": "NORMAL",
    "predictionTime": "2026-09-20T12:00:00Z"
  }
}
```

### Get Latest RUL Prediction
* **GET** `/api/machines/{id}/rul/latest`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

### Get Historical Predictions
* **GET** `/api/machines/{id}/rul?page=0&size=20`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

### Train New RUL Model
* **POST** `/api/ml/train/rul`
* **Authorization**: `ADMIN`
* **Request Body** (optional):
```json
{
  "modelName": "tribuo-linear-sgd",
  "algorithm": "LINEAR_SGD",
  "epochs": 10
}
```

### Get All Registered Models
* **GET** `/api/ml/models`
* **Authorization**: `ADMIN`, `ENGINEER`

### Get Active Model Version
* **GET** `/api/ml/models/active`
* **Authorization**: `ADMIN`, `ENGINEER`
