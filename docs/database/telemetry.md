# Telemetry TimescaleDB Schema & Sensor Data Model

## 1. Sensors Table (`sensors`)

The `sensors` table stores the metadata and threshold configuration for each transducer attached to equipment:

```sql
CREATE TABLE sensors (
    id BIGSERIAL PRIMARY KEY,
    machine_id BIGINT NOT NULL REFERENCES machines(id),
    sensor_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    sensor_type VARCHAR(30) NOT NULL,
    unit VARCHAR(30) NOT NULL,
    sampling_interval_ms INT NOT NULL DEFAULT 1000,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    min_operating_value DOUBLE PRECISION,
    max_operating_value DOUBLE PRECISION,
    warning_threshold DOUBLE PRECISION,
    critical_threshold DOUBLE PRECISION,
    last_reading_time TIMESTAMPTZ,
    last_reading_value DOUBLE PRECISION,
    health_state VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

### Sensor Types
- `TEMPERATURE` (°C)
- `VIBRATION` (mm/s)
- `CURRENT` (A)
- `PRESSURE` (psi)
- `RPM` (RPM)
- `ACOUSTIC` (dB)
- `FLOW_RATE` (sccm / lpm)
- `VOLTAGE` (V)
- `HUMIDITY` (%)
- `OTHER`

---

## 2. TimescaleDB Telemetry Hypertable (`sensor_readings`)

High-frequency telemetry is stored in the partitioned hypertable:

```sql
CREATE TABLE sensor_readings (
    time TIMESTAMPTZ NOT NULL,
    sensor_id BIGINT NOT NULL,
    machine_id BIGINT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    quality VARCHAR(20) NOT NULL DEFAULT 'GOOD'
);

-- TimescaleDB partitioning declaration
SELECT create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);

-- Composite time-range indexes
CREATE INDEX idx_sensor_readings_sensor_time 
    ON sensor_readings (sensor_id, time DESC);

CREATE INDEX idx_sensor_readings_machine_time 
    ON sensor_readings (machine_id, time DESC);
```

### Composite Primary Key
The JPA entity `SensorReading` maps a composite ID `@IdClass(SensorReadingId.class)` comprised of `(sensor_id, time)`.

### Reading Quality Flags
- `GOOD`: Reading is within nominal equipment boundaries.
- `WARNING`: Reading has breached the warning threshold or exceeded normal operating range.
- `BAD`: Reading has breached the critical equipment threshold or transducer error was detected.
