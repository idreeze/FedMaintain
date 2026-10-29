# Telemetry Ingestion & Real-Time Processing Architecture

## 1. Overview

FedMaintain is designed to handle high-frequency time-series telemetry emitted by semiconductor fabrication tools (e.g. Chemical Mechanical Planarization [CMP], Plasma Etchers, and Chemical Vapor Deposition [CVD] systems).

```
Sensors / Industrial Simulator
            │
            │ MQTT (JSON Payload via TCP 1883)
            ▼
    Mosquitto Broker
            │
            │ Topic: fedmaintain/plant/{plantCode}/area/{areaCode}/machine/{machineCode}/sensor/{sensorCode}
            ▼
    Spring Boot Backend
      ├── MqttSubscriber (Paho MQTT Client)
      ├── TelemetryService (Validation, Threshold Evaluation, Quality Tagging)
      └── SensorSimulatorService (Simulation modes: NORMAL, DEGRADING, CRITICAL, FAILURE)
            │
            │ SQL INSERT INTO sensor_readings
            ▼
TimescaleDB (PostgreSQL 16)
      └── Hypertable: sensor_readings (Partitioned by time)
            │
            │ REST API (/api/sensors/{id}/readings, /api/machines/{id}/latest-readings)
            ▼
React Frontend Dashboard
      ├── Live Stream Poller (3s auto-refresh)
      ├── Multi-Metric Recharts Visualizer
      └── Dynamic Threshold Warning/Critical Alarm Indicators
```

## 2. Ingestion Pipeline Components

### 2.1 Edge & Simulator Layer
- Sensors produce readings at 1Hz (1,000ms intervals).
- Readings are formatted as a unified JSON structure:
```json
{
  "machineCode": "CMP-001",
  "sensorCode": "CMP-001-VIB-01",
  "sensorType": "VIBRATION",
  "value": 4.82,
  "unit": "mm/s",
  "timestamp": "2026-09-19T18:30:00.000Z"
}
```

### 2.2 MQTT Transport Layer
- **Broker**: Eclipse Mosquitto listening on port 1883.
- **Client**: Eclipse Paho MQTT Java Client (`org.eclipse.paho.client.mqttv3:1.2.5`).
- **Resilience**: `MqttSubscriber` implements automatic reconnect logic with non-blocking reconnection intervals every 10 seconds. When running in isolated development or unit test mode without a live broker, the ingestion pipeline seamlessly falls back to direct service ingestion.

### 2.3 Threshold & Quality Evaluation
Each incoming telemetry reading is evaluated against equipment limits:
1. **Critical Breach**: `value >= sensor.criticalThreshold` → Tagged as `ReadingQuality.BAD` and `SensorHealthState.CRITICAL`.
2. **Warning Breach**: `value >= sensor.warningThreshold` or outside operating limits `[minOperatingValue, maxOperatingValue]` → Tagged as `ReadingQuality.WARNING` and `SensorHealthState.WARNING`.
3. **Normal Stream**: Reading within nominal limits → Tagged as `ReadingQuality.GOOD` and `SensorHealthState.NORMAL`.

Sensor metadata (`lastReadingValue`, `lastReadingTime`, `healthState`) is updated atomically and the data point is committed to the hypertable.

### 2.4 Time-Series Hypertable
Readings are stored in the TimescaleDB hypertable `sensor_readings`. The table is partitioned by chunk intervals on `time` with compound indexes on `(sensor_id, time DESC)` and `(machine_id, time DESC)`.
