# FedMaintain

**Federated Learning & Digital Twin Platform for Predictive Maintenance in Semiconductor Manufacturing**

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![TimescaleDB](https://img.shields.io/badge/TimescaleDB-PG16-yellow.svg)](https://www.timescale.com/)
[![MQTT](https://img.shields.io/badge/MQTT-Eclipse%20Mosquitto-red.svg)](https://mosquitto.org/)
[![Tribuo ML](https://img.shields.io/badge/Tribuo-Pure%20Java%20ML-blue.svg)](https://tribuo.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-teal.svg)](https://tailwindcss.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12-indigo.svg)](https://recharts.org/)
[![Tests](https://img.shields.io/badge/Tests-75%2F75%20Passing-brightgreen.svg)]()

---

## 1. Project Overview

**FedMaintain** is an industrial-grade predictive maintenance, federated learning, and digital twin operating platform engineered specifically for the extreme reliability demands of semiconductor manufacturing facilities (wafer fabs). 

In advanced semiconductor nodes (3nm, 2nm, and GAA architectures), unexpected tool failure during photolithography, plasma etch, or chemical mechanical planarization (CMP) ruins entire wafer lots, causing millions of dollars in scrapped yield and cleanroom downtime. FedMaintain combines:
- **Cleanroom Asset Hierarchy**: Organization → Plant → Production Bay → Equipment Tool → Attached Sensors.
- **High-Frequency In-Situ Telemetry**: Partitioned TimescaleDB hypertable ingestion with microsecond time resolution.
- **MQTT Transport & Industrial Edge Simulator**: Paho MQTT client with multi-mode simulation (`NORMAL`, `DEGRADING`, `WARNING`, `CRITICAL`, `FAILURE`).
- **Feature Engineering**: Sliding time windows, statistical moments, RMS, and trend slopes.
- **Pure Java RUL Machine Learning**: Tribuo ML regression for Remaining Useful Life forecasts without external Python dependencies.
- **Explainable AI (XAI) & Health Scoring**: Feature deviation attribution, multi-sensor weighted health scoring, and prescriptive actions.
- **Predictive Alerts**: Proactive alert generation, acknowledgment, and resolution workflows.
- **Privacy-Preserving Federated Learning**: Multi-fab collaborative intelligence with Federated Averaging (`FedAvg`) without raw wafer recipe IP exposure.
- **Operational Digital Twin**: Deterministic operating state transition engine, live sensor subsystem status, and lifecycle event timelines.
- **Role-Based Cleanroom Security**: Strict cryptographic authorization across `ADMIN`, `ENGINEER`, and `OPERATOR` roles.

---

## 2. Implementation Status (All Phases 1–10 Complete)

- [x] **Phase 1: Project Foundation** (Modular monolith, Java 21, Spring Boot 3.3, React 18, Vite, TimescaleDB setup, Actuator, Docker Compose)
- [x] **Phase 2: Authentication & User Management** (Spring Security, JWT, BCrypt, RBAC, AuthContext, Protected Routes, Login UI, Role-based Sidebar)
- [x] **Phase 3: Plant, Production Area & Machine Management** (Semiconductor fab hierarchy, CRUD REST APIs, equipment status state machine, soft-deletion)
- [x] **Phase 4: Sensor Processing & Industrial Telemetry Pipeline** (TimescaleDB hypertable, Paho MQTT subscriber, edge telemetry simulator, live Recharts monitoring dashboard)
- [x] **Phase 5: Data Engineering & ML Feature Engineering** (Validation, resampling, sliding windows, trend and RMS extraction, machine feature persistence)
- [x] **Phase 6: Pure Java RUL Machine Learning** (Synthetic run-to-failure labeling, Tribuo Ridge/Linear/Tree models, model versioning, leakage-free dataset splitting, RUL inference APIs)
- [x] **Phase 7: Explainable AI & Predictive Maintenance Alerts** (Feature deviation engine, weighted health calculation, automatic predictive alerts, prescriptive maintenance recommendations)
- [x] **Phase 8: Distributed Federated Learning** (Multi-fab client nodes, training rounds, FedAvg aggregation engine, convergence tracking, centralized vs. federated comparison)
- [x] **Phase 9: Operational Digital Twin** (Deterministic state transition engine, multi-source synchronization, history snapshots, live subsystems, event timeline cockpit)
- [x] **Phase 10: Full System Integration, Demo Validation & Final Hardening** (Verification of Scenarios A–F, 75 passing unit/integration tests, zero frontend build errors, production packaging)

---

## 3. Technology Stack

### Backend
- **Java 21 LTS** (Eclipse Temurin / OpenJDK)
- **Spring Boot 3.3.4** (Modular Monolith)
- **Spring Security 6** (Stateless JWT authentication filter & method authorization)
- **JJWT 0.12.6** (HMAC-SHA256 token generation & validation)
- **Spring Data JPA & Hibernate 6**
- **Tribuo 4.3.1** (Oracle Labs Pure Java ML Library)
- **Eclipse Paho MQTT Client 1.2.5** (Auto-reconnecting subscriber & publisher)
- **PostgreSQL 16 & TimescaleDB** (Hypertable time-series storage)
- **H2 Database** (In-memory testing)
- **JUnit 5 & Mockito** (75 passing unit & integration tests)

### Frontend
- **React 18** Single Page Application
- **TypeScript 5.5** (Strict mode, 0 lint/compile errors)
- **Vite 5.4** (Fast HMR & production bundler)
- **React Router v6** (Protected routing & role-guarded routes)
- **Axios** (JWT interceptors & automatic 401 handling)
- **Tailwind CSS 3.4** (Semiconductor cleanroom dark theme)
- **Recharts 2.12** (Multi-metric equipment telemetry, feature trends, and RUL degradation curves)
- **Lucide React** (Clean industrial iconography)

---

## 4. Backend Architecture & Package Structure

```
com.fedmaintain
├── alert               # Maintenance alerts, alert rules, resolution workflows, AlertController
├── auth                # JWT token generation, authentication controller & DTOs
├── common              # Standard ApiResponse, PageResponse
├── config              # SecurityConfig, CorsConfig, DataInitializer (seeds plant, areas, tools, sensors, twins)
├── controller          # HealthController, TestSecurityController
├── dashboard           # DashboardController, DashboardStatsResponse, DashboardService
├── digitaltwin         # DigitalTwin entity, DigitalTwinState, StateTransitionEngine, SyncService, DigitalTwinController
├── exception           # GlobalExceptionHandler, ResourceNotFoundException, ErrorResponse
├── feature             # Sliding window feature extraction, statistical aggregators, MachineFeatureRepository, FeatureController
├── federated           # Federated coordinator, simulated fab clients, FedAvg aggregation engine, FederatedController
├── machine             # Machine entity, MachineStatus, MachineCriticality, MachineService, MachineController
├── ml                  # Tribuo ML model training, RUL inference, model versioning, dataset splitting, RulController
│   ├── dataset         # Run-to-failure label generation, leakage-free temporal splitting
│   ├── evaluation      # MAE, RMSE, R² evaluation service
│   ├── explainability  # SHAP-style feature attribution & directional deviation engine
│   ├── health          # Weighted multi-sensor health scoring & prescriptive recommendations
│   └── model           # Java ML training & version management
├── plant               # Plant entity, PlantStatus, PlantService, PlantController
├── productionarea      # ProductionArea entity, AreaStatus, ProductionAreaService, ProductionAreaController
├── security            # JwtService, JwtAuthenticationFilter, CustomAccessDeniedHandler
├── sensor              # Sensor entity, SensorReading hypertable entity, SensorType, SensorService, SensorController
├── telemetry           # TelemetryService, TelemetryController, MqttSubscriber, SensorSimulatorService, SimulatorController
└── user                # User entity, Role (ADMIN, ENGINEER, OPERATOR), UserRepository, UserService
```

---

## 5. End-to-End Pipeline & Scenario Demonstration

```
Sensor Simulator ──(MQTT)──> Spring Boot Telemetry ──> TimescaleDB
                                    │
                                    ▼
Feature Engineering ───────> Tribuo RUL ML Model
        │                           │
        ▼                           ▼
Machine Health (0-100) ────> Predictive Alerts
        │                           │
        └─────────────┬─────────────┘
                      ▼
            Digital Twin Engine
         (Deterministic Priority)
                      │
                      ▼
            React Digital Twin Cockpit
```

### Supported Operating Scenarios:
- **SCENARIO A (NORMAL)**: Nominal telemetry, Health 95–100%, RUL > 200h, State: `NORMAL`.
- **SCENARIO B (DEGRADING)**: Upward vibration drift, Health 80–90%, RUL declining, State: `DEGRADING`.
- **SCENARIO C (WARNING)**: Elevated vibration/temperature, RUL $\le 72$h, open warning alert, State: `WARNING`.
- **SCENARIO D (CRITICAL)**: Extreme threshold spike, RUL $\le 24$h, open critical alert, State: `CRITICAL`.
- **SCENARIO E (FAILURE)**: Catastrophic tool event or health $\le 20$%, State: `FAILURE`.
- **SCENARIO F (OFFLINE)**: Telemetry stream interrupted ($> 60$s), State: `OFFLINE`.

---

## 6. Role-Based Access Matrix

| Role | Permissions | Available Capabilities |
| :--- | :--- | :--- |
| **`ADMIN`** | Full System Access | Asset management, user management, trigger federated rounds, manual twin synchronization, simulator control |
| **`ENGINEER`** | Maintenance & Analytics | Manage assets & sensors, inspect ML features & RUL predictions, run federated training, manage alerts, digital twin cockpit |
| **`OPERATOR`** | Floor Monitoring | View plants, machines, live telemetry dashboards, review digital twin states, view open alerts |

---

## 7. Default Credentials (Seeded by DataInitializer)

| Role | Email | Password |
| :--- | :--- | :--- |
| **ADMIN** | `admin@fedmaintain.com` | `Admin@123` |
| **ENGINEER** | `engineer@fedmaintain.com` | `Engineer@123` |
| **OPERATOR** | `operator@fedmaintain.com` | `Operator@123` |

---

## 8. Quick Start Guide

### Prerequisites
- Java 21 LTS (`java -version`)
- Maven 3.9+ (`mvn -version`)
- Node.js 20+ & npm (`node -v`, `npm -v`)

### Step 1: Run Backend & Execute Tests
```bash
cd backend
mvn test
mvn spring-boot:run
```
*Backend starts on `http://localhost:8080`. Automatically seeds Plant `BLR-01`, 4 cleanroom bays, 3 machines, 10 sensors, initial telemetry readings, and registered Digital Twins.*

### Step 2: Run Frontend SPA
```bash
cd frontend
npm install
npm run dev
```
*Frontend starts on `http://localhost:5173`. Open `/digital-twins` for the Fleet Cockpit.*

### Step 3: Run Full Stack with Docker Compose
```bash
docker compose up --build -d
```
*Launches TimescaleDB (`5432`), Eclipse Mosquitto MQTT (`1883`), Spring Boot backend (`8080`), and Nginx React frontend (`5173`).*

---

## 9. Key Documentation
- [Phase 9: Digital Twin Specification](docs/PHASE-9-DIGITAL-TWIN.md)
- [Phase 10: Full System Verification & Hardening](docs/FINAL-SYSTEM-VERIFICATION.md)
- [Phases 5–8 Architecture Guide](docs/architecture/phases-5-8-architecture.md)
- [Telemetry Architecture](docs/architecture/telemetry.md)
- [TimescaleDB Schema](docs/database/telemetry.md)
