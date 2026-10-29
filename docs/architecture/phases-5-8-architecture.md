# FedMaintain Phases 5–8 Architectural Specification

This document details the architectural design and data flow implemented across Phases 5, 6, 7, and 8 of the FedMaintain platform.

```
+-----------------------------------------------------------------------------------+
|                            FedMaintain Architecture                               |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  Phase 4: Telemetry Pipeline                                                      |
|  [Simulated CMP/Etch Sensors] ---> [MQTT: Mosquitto] ---> [TimescaleDB Hypertables] |
|                                                                    |              |
|  Phase 5: Feature Engineering                                      v              |
|  [Data Quality & Imputation] <--- [Resampling 1Hz] <--- [Sliding Windows (60s/30s)] |
|                                                                    |              |
|  Phase 6: RUL Machine Learning (Java Tribuo)                       v              |
|  [Linear SGD Trainer] <--- [Leakage-Free run_id Split] <--- [Feature Aggregations]|
|                                                                    |              |
|  Phase 7: Explainable AI & Alerts                                  v              |
|  [Health Scoring 0-100] <--- [XAI Baselines & Attributions] <--- [RUL Inferences] |
|           |                                                                       |
|           +---> [Deduplicated Alert Engine] ---> [Prescriptive Recommendations]   |
|                                                                                   |
|  Phase 8: Decentralized Federated Learning (FedAvg)                               |
|  [Client Silo A]      [Client Silo B]      [Client Silo C]                        |
|       |                     |                    |                                |
|  (Local Gradients)     (Local Gradients)    (Local Gradients)                     |
|       |                     |                    |                                |
|       +---------------------> [FedAvg Orchestrator] <-----------------------------+
|                                      |                                            |
|                               (Global Weights)                                    |
|                                      v                                            |
|                          [Global Model Registry]                                  |
+-----------------------------------------------------------------------------------+
```

---

## 1. Phase 5 — Feature Engineering & Sliding Windows
* **Sliding Window Generator**: Computes bounded intervals (`windowStart`, `windowEnd`) with configurable step sizes (e.g., 60-second window, 30-second step / 50% overlap).
* **Statistical Extractor**: Calculates mean, std deviation, min, max, range, root mean square (RMS), and linear least-squares regression slope for trend identification.
* **Resampler & Imputer**: Resamples erratic telemetry frequencies to deterministic 1-second ticks; applies forward-fill with threshold cutoff for sensor dropouts.
* **Data Quality Assessor**: Evaluates completeness, validity, timeliness, and anomaly rates across incoming sensor streams.

## 2. Phase 6 — Remaining Useful Life (RUL) Modeling
* **Java ML Engine**: 100% pure Java implementation using Oracle Tribuo (`tribuo-regression-linear`). Zero external Python or JVM-Python bridges.
* **Label Generation**: Ground truth Remaining Useful Life computed in hours: $RUL = \max(0, T_{\text{failure}} - t)$.
* **Leakage-Free Splitter**: Splits dataset into training, validation, and testing partitions strictly by unique machine operational run identifiers (`run_id`). No overlapping time windows between train and test splits.
* **Model Registry**: Manages model artifacts, version metadata (`ACTIVE`, `CANDIDATE`, `ARCHIVED`), and deterministic evaluation metrics (MAE, RMSE, $R^2$).

## 3. Phase 7 — Explainability Engine & Predictive Alerts
* **Subsystem Health Scoring**: Health score (0–100) combining thermal, vibration, electrical, and pressure subsystems with continuous degradation functions.
* **Feature Attribution & Baselines**: Compares current window statistics against machine-type baseline operating envelopes. Classifies deviations into `HIGH`, `MEDIUM`, and `LOW` impact with directional indicators (`INCREASING`, `DECREASING`, `NEUTRAL`).
* **Alert Deduplication**: Updates existing active alerts (`status = OPEN` or `ACKNOWLEDGED`) on recurring violations rather than spamming duplicate records. Records trigger value, threshold value, and updated timestamp.
* **Prescriptive Maintenance Actions**: Generates prioritized remediation actions with estimated cleanroom downtime hours and required equipment spare parts.

## 4. Phase 8 — Federated Learning (FedAvg)
* **Client Isolation**: Client data never leaves the local fab node. Only model weight updates $(\mathbf{w}_k, n_k)$ are transmitted to the server orchestrator.
* **Mathematical FedAvg**:
  $$\mathbf{w}_{\text{global}} = \sum_{k=1}^K \frac{n_k}{N} \mathbf{w}_k \quad \text{where } N = \sum_{k=1}^K n_k$$
* **Update Validation**: Rigorously inspects client updates for NaN, $\pm\infty$, dimensionality mismatches, duplicate round submissions, and unregistered client IDs.
* **Fault Tolerance**: Continues round aggregation as long as active responding clients exceed the quorum threshold (`minClients = 2`).
* **Parity Benchmarking**: Automates continuous comparative evaluation against centralized training benchmarks on disjoint test splits.
