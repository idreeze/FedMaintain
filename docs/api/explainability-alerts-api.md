# Phase 7 API Reference: Explainability Engine & Predictive Maintenance Alerts

This document details the REST APIs implemented for Phase 7 (Health Scoring, Explainable AI Feature Baselines, Prescriptive Recommendations, and Predictive Alerts).

---

## 1. Machine Health & Explainability APIs

### Get Overall Machine Health & Subsystem Scores
* **GET** `/api/machines/{id}/health`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "machineId": 1,
    "healthScore": 86.4,
    "status": "HEALTHY",
    "rulHours": 142.5,
    "confidenceLower": 128.2,
    "confidenceUpper": 156.8,
    "subsystemScores": {
      "thermal": 92.0,
      "vibration": 84.5,
      "electrical": 90.0,
      "pressure": 88.0
    },
    "topContributingFactors": [
      "Vibration RMS deviation (+18.4%)"
    ],
    "calculatedAt": "2026-09-20T12:00:00Z"
  }
}
```

### Get Latest XAI Feature Explanations
* **GET** `/api/machines/{id}/explanations/latest`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "predictionId": 42,
    "machineId": 1,
    "predictedRulHours": 142.5,
    "healthScore": 86.4,
    "status": "HEALTHY",
    "explanations": [
      {
        "id": 1,
        "featureName": "vibrationRms",
        "featureValue": 4.12,
        "baselineValue": 3.48,
        "deviationPercentage": 18.39,
        "contributionLevel": "MEDIUM",
        "direction": "INCREASING"
      }
    ],
    "explanationSummary": "Primary degradation driver: vibrationRms (+18.4% above baseline)"
  }
}
```

### Get Prescriptive Maintenance Recommendations
* **GET** `/api/machines/{id}/recommendations`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "machineId": 1,
    "machineCode": "CMP-001",
    "healthScore": 86.4,
    "status": "HEALTHY",
    "recommendations": [
      {
        "title": "Inspect Spindle Bearing Assembly",
        "description": "Vibration harmonic patterns show early stage wear on high-speed polisher spindle.",
        "priority": "MEDIUM",
        "estimatedDowntimeHours": 2.5,
        "recommendedSpares": ["BEARING-CMP-7201", "SEAL-VITON-45"]
      }
    ]
  }
}
```

---

## 2. Predictive Maintenance Alerts APIs

### List Alerts with Filtering
* **GET** `/api/alerts?status=OPEN&severity=CRITICAL&page=0&size=20`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Query Parameters**:
  * `machineId` (Long, optional)
  * `status` (`OPEN`, `ACKNOWLEDGED`, `RESOLVED`, optional)
  * `severity` (`INFO`, `WARNING`, `CRITICAL`, optional)
  * `alertType` (`RUL_THRESHOLD_BREACH`, `RAPID_DEGRADATION`, `ANOMALOUS_VIBRATION`, etc., optional)
  * `page` (int, default 0)
  * `size` (int, default 20)

### Get Alert Summary Statistics
* **GET** `/api/alerts/summary`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "totalAlerts": 12,
    "criticalAlerts": 2,
    "warningAlerts": 4,
    "openAlerts": 6,
    "acknowledgedAlerts": 3,
    "resolvedAlerts": 3
  }
}
```

### Acknowledge Alert
* **POST** `/api/alerts/{id}/acknowledge`
* **Authorization**: `ADMIN`, `ENGINEER`

### Resolve Alert
* **POST** `/api/alerts/{id}/resolve`
* **Authorization**: `ADMIN`, `ENGINEER`
