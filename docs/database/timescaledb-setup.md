# Database Architecture & TimescaleDB Setup — FedMaintain

FedMaintain leverages PostgreSQL 16 enhanced with the **TimescaleDB** extension to achieve sub-millisecond query performance on massive semiconductor equipment sensor time-series data while maintaining relational integrity for user accounts and metadata.

---

## 1. Schema Specifications (Phase 2)

### Table: `users`

The `users` table stores platform accounts, encrypted credentials, and access control roles.

```sql
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

---

## 2. TimescaleDB Extension Initialization

During container startup, `database/init/01-init-timescaledb.sql` is mounted to `/docker-entrypoint-initdb.d/` and executes:

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Readiness for Future Phases:
- **Phase 4 (Sensor Telemetry)**: Sensor readings will be stored in Hypertables chunked by time intervals (e.g. 1-day chunks) supporting continuous aggregation policies, retention policies, and automatic compression ratios exceeding 90%.
- **Phase 6 (Digital Twin)**: High-frequency telemetry streams (100Hz+) from etch chamber mass flow controllers, wafer stage interferometers, and RF matching networks will be queried via hypertable time-bucketing functions (`time_bucket('1 second', timestamp)`).
