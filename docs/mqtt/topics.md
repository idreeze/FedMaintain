# MQTT Industrial Telemetry Topics & Specifications

## 1. Broker Configuration

- **Host**: `localhost` (in development) / `mosquitto` container (in Docker Compose)
- **Default Port**: `1883` (TCP)
- **WebSocket Port**: `9001` (WS)
- **Protocol**: MQTT v3.1.1 / v5.0 compliant
- **Authentication**: Anonymous enabled for dev; token/user auth for production cleanroom edge gateways.

---

## 2. Topic Taxonomy

FedMaintain uses a hierarchical industrial topic structure matching the plant asset tree:

```
fedmaintain/plant/{plantCode}/area/{areaCode}/machine/{machineCode}/sensor/{sensorCode}
```

### Examples
- `fedmaintain/plant/BLR-01/area/CMP-AREA/machine/CMP-001/sensor/CMP-001-VIB-01`
- `fedmaintain/plant/BLR-01/area/CMP-AREA/machine/CMP-001/sensor/CMP-001-TEMP-01`
- `fedmaintain/plant/BLR-01/area/ETCH-AREA/machine/ETCH-001/sensor/ETCH-001-VIB-01`

### Backend Subscription Filter
The backend subscribes to the root wildcard topic:
```text
fedmaintain/#
```
This captures all sensor readings across all plants, areas, and equipment automatically.

---

## 3. Telemetry Payload Schema

Every reading message sent over MQTT must conform to the following JSON structure:

```json
{
  "machineCode": "CMP-001",
  "sensorCode": "CMP-001-TEMP-01",
  "sensorType": "TEMPERATURE",
  "value": 52.4,
  "unit": "°C",
  "timestamp": "2026-09-19T18:35:12.124Z"
}
```

### Field Definitions
- `machineCode` (string, required): Matches `machines.machine_code`.
- `sensorCode` (string, required): Matches `sensors.sensor_code`.
- `sensorType` (string, required): One of `TEMPERATURE`, `VIBRATION`, `CURRENT`, `PRESSURE`, `RPM`, `ACOUSTIC`, `FLOW_RATE`, `VOLTAGE`, `HUMIDITY`, `OTHER`.
- `value` (double, required): Numerical sensor reading.
- `unit` (string, optional): Engineering unit (e.g. `°C`, `mm/s`, `A`, `psi`, `RPM`, `dB`).
- `timestamp` (ISO-8601 string, optional): Time reading was captured at the edge. Defaults to `Instant.now()` if omitted.
