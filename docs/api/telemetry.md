# Telemetry & Sensor REST API Reference

All requests require JWT Bearer Authentication in the `Authorization: Bearer <token>` header.

---

## Sensor Catalog Endpoints (`/api`)

### 1. List Sensors for Machine
- **Endpoint**: `GET /api/machines/{machineId}/sensors`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "machineId": 1,
    "machineCode": "CMP-001",
    "sensorCode": "CMP-001-TEMP-01",
    "name": "Main Spindle Temperature",
    "sensorType": "TEMPERATURE",
    "unit": "°C",
    "samplingIntervalMs": 1000,
    "status": "ACTIVE",
    "minOperatingValue": 20.0,
    "maxOperatingValue": 95.0,
    "warningThreshold": 75.0,
    "criticalThreshold": 85.0,
    "lastReadingTime": "2026-09-19T18:40:00Z",
    "lastReadingValue": 52.4,
    "healthState": "NORMAL"
  }
]
```

### 2. Attach Sensor to Machine
- **Endpoint**: `POST /api/machines/{machineId}/sensors`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Request Body**:
```json
{
  "sensorCode": "CMP-001-VIB-02",
  "name": "Secondary Spindle Vibration",
  "sensorType": "VIBRATION",
  "unit": "mm/s",
  "samplingIntervalMs": 1000,
  "minOperatingValue": 0.0,
  "maxOperatingValue": 15.0,
  "warningThreshold": 5.0,
  "criticalThreshold": 8.0
}
```
- **Response**: `201 Created`

### 3. Update Sensor Status
- **Endpoint**: `PATCH /api/sensors/{id}/status`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Response**: `200 OK`

---

## Telemetry Time-Series Endpoints (`/api`)

### 1. Query Sensor Readings
- **Endpoint**: `GET /api/sensors/{id}/readings`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Query Parameters**:
  - `start` (ISO-8601, optional, default: 1 hour ago)
  - `end` (ISO-8601, optional, default: now)
  - `limit` (int, default: 100, max: 2000)
- **Response**: `200 OK` (`List<SensorReadingDto>`)

### 2. Query Machine Readings
- **Endpoint**: `GET /api/machines/{id}/readings`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK`

### 3. Get Latest Reading by Sensor
- **Endpoint**: `GET /api/sensors/{id}/latest`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK`

### 4. Get Latest Readings for All Sensors of a Machine
- **Endpoint**: `GET /api/machines/{id}/latest-readings`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK`
```json
{
  "machineId": 1,
  "machineCode": "CMP-001",
  "readings": [
    {
      "sensorCode": "CMP-001-TEMP-01",
      "sensorType": "TEMPERATURE",
      "value": 52.4,
      "unit": "°C",
      "timestamp": "2026-09-19T18:40:00Z",
      "quality": "GOOD",
      "status": "NORMAL"
    }
  ]
}
```

### 5. Ingest Telemetry via HTTP
- **Endpoint**: `POST /api/telemetry/readings`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Request Body**:
```json
{
  "machineCode": "CMP-001",
  "sensorCode": "CMP-001-TEMP-01",
  "sensorType": "TEMPERATURE",
  "value": 54.2,
  "unit": "°C",
  "timestamp": "2026-09-19T18:40:00Z"
}
```
- **Response**: `202 Accepted`

---

## Simulator Control Endpoints (`/api/simulator`)

### 1. Get Simulator Status
- **Endpoint**: `GET /api/simulator/status`
- **Response**: `200 OK`
```json
{
  "running": true,
  "mode": "NORMAL",
  "totalTicks": 42,
  "totalReadingsGenerated": 420
}
```

### 2. Change Simulator Operating Mode
- **Endpoint**: `POST /api/simulator/mode/{mode}`
- **Modes**: `NORMAL`, `DEGRADING`, `CRITICAL`, `FAILURE`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Response**: `200 OK`

### 3. Trigger Single Simulation Tick
- **Endpoint**: `POST /api/simulator/tick`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Response**: `200 OK`
```json
{
  "message": "Simulated tick generated",
  "simulatedCount": 10,
  "mode": "NORMAL"
}
```
