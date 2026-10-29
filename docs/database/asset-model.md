# Semiconductor Asset Hierarchy Data Model

## 1. Domain Hierarchy

The asset model represents the physical and functional hierarchy of semiconductor manufacturing cleanrooms:

```text
Organization (FedMaintain Platform)
    └── Plant (Fab Facility)
          └── Production Area (Cleanroom Bay / Functional Area)
                └── Machine (Tool / Equipment)
                      └── Sensor (Transducer / Telemetry Channel)
```

## 2. Relational Schema

### 2.1 Plants (`plants`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Unique plant identifier |
| `code` | VARCHAR(50) | NOT NULL, UNIQUE | Plant code (e.g. `BLR-01`) |
| `name` | VARCHAR(150) | NOT NULL | Facility name (e.g. `Bengaluru Fab 1`) |
| `location` | VARCHAR(200) | NOT NULL | Geographic location / physical address |
| `description` | TEXT | NULL | Facility technical specifications |
| `status` | VARCHAR(20) | NOT NULL | `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `DECOMMISSIONED` |
| `created_at` | TIMESTAMPTZ | NOT NULL | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

### 2.2 Production Areas (`production_areas`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Unique area identifier |
| `plant_id` | BIGINT | NOT NULL, FK(`plants.id`) | Parent manufacturing facility |
| `code` | VARCHAR(50) | NOT NULL | Bay code (e.g. `CMP-AREA`, `ETCH-AREA`) |
| `name` | VARCHAR(150) | NOT NULL | Bay name (e.g. `CMP Polishing Bay`) |
| `description` | TEXT | NULL | Cleanroom functional purpose |
| `status` | VARCHAR(20) | NOT NULL | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| `created_at` | TIMESTAMPTZ | NOT NULL | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

*Composite Unique Constraint: `(plant_id, code)`.*

### 2.3 Machines (`machines`)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGSERIAL | PRIMARY KEY | Unique machine identifier |
| `production_area_id` | BIGINT | NOT NULL, FK(`production_areas.id`) | Cleanroom bay assignment |
| `machine_code` | VARCHAR(50) | NOT NULL, UNIQUE | Asset tracking tag (e.g. `CMP-001`) |
| `name` | VARCHAR(150) | NOT NULL | Machine name |
| `machine_type` | VARCHAR(50) | NOT NULL | Tool classification (e.g. `CMP`, `ETCH`, `CVD`, `LITHO`) |
| `manufacturer` | VARCHAR(100) | NULL | Tool OEM (e.g. `Applied Materials`, `Lam Research`) |
| `model_number` | VARCHAR(100) | NULL | Equipment model (e.g. `Reflexion LK`) |
| `serial_number` | VARCHAR(100) | UNIQUE, NULL | Manufacturer serial number |
| `installationDate`| DATE | NULL | Date commissioned on cleanroom floor |
| `status` | VARCHAR(20) | NOT NULL | `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `WARNING`, `CRITICAL`, `DECOMMISSIONED` |
| `criticality` | VARCHAR(20) | NOT NULL | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `description` | TEXT | NULL | Tool specifications and notes |
| `created_at` | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

### 2.4 Soft Deletion & Audit Integrity
When a machine is decommissioned (`DELETE /api/machines/{id}`), it is marked with `status = 'DECOMMISSIONED'` instead of a physical deletion. This guarantees all historical sensor readings, maintenance logs, and prediction models remain intact for historical wafer yield correlations and auditing.
