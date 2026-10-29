# FedMaintain Datasets Reference

This directory contains the machine learning and federated learning datasets used by the **FedMaintain** predictive maintenance platform for semiconductor manufacturing equipment.

---

## 1. Summary of Datasets

| Dataset | File / Location | Size | Type | Target / Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **RUL Supervised Dataset (v1)** | [`rul_training_dataset_v1.csv`](file:///C:/Users/IDREEZE/.gemini/antigravity/scratch/fedmaintain/datasets/rul_training_dataset_v1.csv) | 120 window samples (5 runs) | Tabular ML Features | Predict **RUL (Remaining Useful Life in hours)** |
| **Federated Multi-Plant Datasets** | [`federated_local_datasets.csv`](file:///C:/Users/IDREEZE/.gemini/antigravity/scratch/fedmaintain/datasets/federated_local_datasets.csv) | 365 local samples (3 plants) | Non-IID Normalized Features | Collaborative Federated Learning across plants |
| **Raw Telemetry Stream** | Database: TimescaleDB `sensor_readings` | Real-time (1 tick / 4s) | High-frequency IoT Time Series | Ingestion via MQTT `fedmaintain/#` |
| **Sliding Window Features** | Database: PostgreSQL `machine_features` | 30m window / 5m step | Aggregated statistical features | Input to RUL models & Digital Twin state |

---

## 2. Supervised RUL Prediction Dataset (`rul_training_dataset_v1.csv`)

### Problem Definition
Given 30-minute statistical and trend features of a semiconductor tool (CMP, Plasma Etch, CVD), estimate the **Remaining Useful Life (RUL)** until component/tool failure.

### Target Variable
- **`rul_hours`**: Ground truth hours until failure:
  $$\text{RUL} = \frac{T_{\text{failure}} - T_{\text{window\_end}}}{3600}$$
  Ranges from **47.5 hours down to 1.5 hours** prior to tool failure.

### Data Split Strategy (Leakage-Free by Run ID)
To prevent temporal data leakage across sliding windows, the dataset is split strictly by complete degradation lifecycles (`run_id`):
- **Training Set (75% / 72 samples)**:
  - `RUN-CMP001-CYCLE-01` (24 windows)
  - `RUN-CMP001-CYCLE-02` (24 windows)
  - `RUN-CMP001-CYCLE-03` (24 windows)
- **Holdout Test Set (25% / 48 samples)**:
  - `RUN-ETCH001-CYCLE-01` (24 windows)
  - `RUN-ETCH001-CYCLE-02` (24 windows)

### Feature Schema (18 Engineered Features)
- **Thermal**: `temperature_mean`, `temperature_std`, `temperature_trend`, `temperature_deviation_pct`
- **Vibration**: `vibration_mean`, `vibration_std`, `vibration_rms`, `vibration_trend`, `vibration_deviation_pct`
- **Electrical**: `current_mean`, `current_std`, `current_trend`, `current_deviation_pct`
- **Vacuum / Process Pressure**: `pressure_mean`, `pressure_trend`
- **Spindle Speed**: `rpm_mean`, `rpm_trend`
- **Acoustic Emission**: `acoustic_mean`, `acoustic_trend`

---

## 3. Federated Learning Local Datasets (`federated_local_datasets.csv`)

### Architecture
Simulates **3 distinct semiconductor fabrication plants** collaborating via Federated Averaging (FedAvg) without sharing raw telemetry data:

1. **PLANT-A (Bengaluru Fab 1)**:
   - Samples: **150**
   - Characteristics: Nominal baseline distribution (seed 42)
2. **PLANT-B (Austin Fab 2)**:
   - Samples: **120**
   - Characteristics: **Thermal drift / higher ambient temperature variation** (+0.25 offset)
3. **PLANT-C (Dresden Fab 3)**:
   - Samples: **95**
   - Characteristics: **Mechanical bearing wear / higher vibration variation** (+0.35 offset)

### Normalized Feature Vector (6 Features per Client)
- `temp_norm`: Normalized temperature
- `vib_norm`: Normalized vibration
- `curr_norm`: Normalized current
- `press_norm`: Normalized pressure
- `rpm_norm`: Normalized motor RPM
- `aco_norm`: Normalized acoustic emission
- `rul_hours`: Local ground truth RUL target (72h down to 0h)
