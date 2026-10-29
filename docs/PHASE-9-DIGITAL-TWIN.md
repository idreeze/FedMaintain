# FedMaintain — Phase 9: Digital Twin Architecture & Specification

## 1. Overview

The **Digital Twin** in FedMaintain is a software-based, deterministic, operational state integration layer for semiconductor manufacturing tools (such as CMP polishers, plasma etch chambers, and CVD systems).

It does **not** duplicate machine learning models, feature engineering pipelines, health score algorithms, or alert processors. Instead, it aggregates and synchronizes data from all preceding operational layers:

```
Physical / Simulated Machine
        ↓
High-Frequency Sensor Telemetry (MQTT / TimescaleDB)
        ↓
Feature Engineering (Sliding Windows & Trends)
        ↓
RUL Machine Learning (Centralized & Federated Models)
        ↓
Machine Health & Explainable AI (SHAP-style Feature Impact)
        ↓
Predictive Alerts & Prescriptive Workflows
        ↓
=====================================================
         FEDMAINTAIN DIGITAL TWIN COCKPIT
   (Deterministic State, Live Sensors, Event Timeline)
=====================================================
```

---

## 2. Core Entities & Data Architecture

The Digital Twin layer persists operational representation across three tables in PostgreSQL / TimescaleDB:

1. `digital_twins`:
   - `id`: Unique identifier
   - `twin_code`: String (e.g., `DT-CMP-001`)
   - `machine_id`: Foreign key reference to `machines(id)` (1-to-1)
   - `status`: Lifecycle status (`ACTIVE`, `INACTIVE`, `SYNCING`, `ERROR`)
   - `created_at`, `updated_at`, `last_synchronized_at`

2. `digital_twin_states`:
   - `digital_twin_id`: Reference to `digital_twins(id)`
   - `machine_id`: Reference to `machines(id)`
   - `operating_state`: Current deterministic operating state (`NORMAL`, `DEGRADING`, `WARNING`, `CRITICAL`, `FAILURE`, `MAINTENANCE`, `OFFLINE`)
   - Latest sensor values: `temperature`, `vibration`, `current`, `pressure`, `rpm`, `acoustic`
   - Health score (0–100) & health category
   - RUL prediction (hours remaining & confidence)
   - Active open alert counts (total, critical, warning)
   - Prescriptive recommendations summary
   - State explanation text

3. `digital_twin_state_history`:
   - High-resolution audit and playback log of state changes.
   - Recorded automatically on state transitions or periodically (every 5 minutes).

---

## 3. Deterministic State Transition Engine

The operating state of each Digital Twin is computed deterministically by `DigitalTwinStateTransitionEngine` using a strict priority hierarchy:

| Priority | Operating State | Trigger Condition |
| :--- | :--- | :--- |
| **1 (Highest)** | `MAINTENANCE` | Physical machine status is explicitly set to `MAINTENANCE`. |
| **2** | `OFFLINE` | No telemetry received within configured timeout (`offlineTimeoutSeconds = 60s`) or telemetry timestamp is null. |
| **3** | `FAILURE` | Machine status is `FAILURE`, health score $\le 20.0$, or an open catastrophic alert is raised. |
| **4** | `CRITICAL` | Any active `CRITICAL` maintenance alert exists, or RUL forecast $\le 24.0\text{ hours}$, or health score $< 40.0$. |
| **5** | `WARNING` | Any active `WARNING` alert exists, or RUL forecast $\le 72.0\text{ hours}$, or health score $< 60.0$. |
| **6** | `DEGRADING` | Health score $< 80.0$, RUL status is `DEGRADING`, or feature trends exhibit continuous drift. |
| **7 (Lowest)** | `NORMAL` | All parameters nominal, fresh telemetry, no active alerts, health score $\ge 80.0$, RUL $> 72.0\text{ hours}$. |

---

## 4. REST API Reference

All endpoints require JWT authentication and enforce Role-Based Access Control (RBAC):

| Method | Path | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/digital-twins` | `ADMIN`, `ENGINEER`, `OPERATOR` | List all digital twin summaries with operational states. |
| `GET` | `/api/digital-twins/{id}` | `ADMIN`, `ENGINEER`, `OPERATOR` | Retrieve full digital twin details, state, and model version attribution. |
| `GET` | `/api/digital-twins/machine/{machineId}` | `ADMIN`, `ENGINEER`, `OPERATOR` | Retrieve digital twin bound to a specific physical machine. |
| `POST` | `/api/digital-twins/{machineId}/sync` | `ADMIN`, `ENGINEER` | Force immediate synchronization of twin state from all submodules. |
| `GET` | `/api/digital-twins/{id}/sensors` | `ADMIN`, `ENGINEER`, `OPERATOR` | Real-time sensor snapshot with calculated trends (`INCREASING`, `DECREASING`, `STABLE`). |
| `GET` | `/api/digital-twins/{id}/timeline` | `ADMIN`, `ENGINEER`, `OPERATOR` | Chronological event stream of state changes, alerts, and RUL drops. |
| `GET` | `/api/digital-twins/{id}/history` | `ADMIN`, `ENGINEER`, `OPERATOR` | Paginated historical state snapshots for trend analysis. |

---

## 5. React Digital Twin Cockpit

The frontend provides an intuitive industrial monitoring interface:

- **Fleet View (`/digital-twins`)**:
  - Live aggregate cards for all twins in the fab.
  - Real-time pulse indicator reflecting operational states.
  - Health score progress bars and RUL estimates.
  - State filtering (`ALL`, `NORMAL`, `DEGRADING`, `WARNING`, `CRITICAL`, `MAINTENANCE`, `OFFLINE`).

- **Cockpit Detail (`/digital-twins/:id`)**:
  - Operational banner with comprehensive explanation of the current state.
  - KPI metric cards: Health Score, Remaining Useful Life, Alert Breakdown, Model Attribution.
  - Prescriptive maintenance banner with actionable engineer recommendations.
  - Interactive tabs:
    1. **Live Sensors & Subsystems**: Sensor readings with real-time trend arrows and threshold badges.
    2. **Twin Event Timeline**: Chronological history of state transitions, alert acknowledgments, and RUL drops.
    3. **Historical State Snapshots**: Paginated historical log of recorded state transitions.
