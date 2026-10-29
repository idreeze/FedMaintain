# Phase 8 API Reference: Federated Learning Orchestrator

This document details the REST APIs implemented for Phase 8 (Federated Learning Rounds, Client Registration, Global Weight Aggregation with FedAvg, and Model Parity Benchmarking).

---

## 1. Federated Learning Operations

### Trigger Federated Training Round
* **POST** `/api/federated/rounds/start`
* **Authorization**: `ADMIN`
* **Request Body** (optional):
```json
{
  "participatingClientIds": ["FAB-TAIWAN-CMP", "FAB-DRESDEN-CMP", "FAB-AUSTIN-CMP"],
  "epochsPerClient": 5,
  "learningRate": 0.01,
  "batchSize": 32
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Federated round completed successfully",
  "data": {
    "id": 1,
    "round": 1,
    "globalModel": "FED_MODEL_V1",
    "globalModelVersion": "FED_MODEL_V1",
    "participatingClients": 3,
    "trainingLoss": 0.0421,
    "mae": 14.8,
    "rmse": 18.2,
    "r2": 0.885,
    "status": "COMPLETED",
    "startedAt": "2026-09-20T12:00:00Z",
    "completedAt": "2026-09-20T12:00:05Z"
  }
}
```

### List All Federated Training Rounds
* **GET** `/api/federated/rounds`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

### Get Specific Round
* **GET** `/api/federated/rounds/{id}`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

---

## 2. Federated Clients & Silo Management

### List All Participating Clients
* **GET** `/api/federated/clients`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "clientId": "FAB-TAIWAN-CMP",
      "plantId": 1,
      "plantCode": "FAB-101",
      "status": "ACTIVE",
      "datasetSize": 5400,
      "lastSeen": "2026-09-20T12:00:00Z",
      "createdAt": "2026-09-20T11:00:00Z"
    }
  ]
}
```

### Get Client Details
* **GET** `/api/federated/clients/{clientId}`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

---

## 3. Global Model Registry & Metrics

### List Global Federated Models
* **GET** `/api/federated/models`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

### Get Global Model Details
* **GET** `/api/federated/models/{id}`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`

### Get Overall Federated Platform Metrics
* **GET** `/api/federated/metrics`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "rounds": [...],
    "latestMae": 14.8,
    "latestRmse": 18.2,
    "latestR2": 0.885,
    "latestTrainingLoss": 0.0421,
    "totalRounds": 3,
    "totalRoundsCompleted": 3,
    "activeClientsCount": 3,
    "totalClients": 3
  }
}
```

### Centralized vs Federated Empirical Comparison
* **GET** `/api/federated/comparison`
* **Authorization**: `ADMIN`, `ENGINEER`, `OPERATOR`
* **Response**:
```json
{
  "success": true,
  "data": {
    "centralizedModelVersion": "CENTRAL_TRIBUO_SGD_V1",
    "centralizedAlgorithm": "LINEAR_SGD",
    "centralizedMae": 14.2,
    "centralizedRmse": 17.8,
    "centralizedR2": 0.892,
    "federatedModelVersion": "FED_MODEL_V3",
    "federatedAlgorithm": "FED_LINEAR_REGRESSION",
    "federatedMae": 14.8,
    "federatedRmse": 18.2,
    "federatedR2": 0.885,
    "privacyStrategy": "Sample-Weighted FedAvg + Client Data Isolation",
    "evaluationMethodology": "Disjoint run_id Holdout Test Set",
    "factualSummary": "Federated model achieves 98.6% relative performance of centralized model while preserving complete data residency across fab silos."
  }
}
```
