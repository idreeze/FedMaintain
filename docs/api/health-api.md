# Health Check API Specification — FedMaintain

## 1. GET /api/health

Returns the operational status, application name, and version of the backend service.

- **URL**: `/api/health`
- **Method**: `GET`
- **Authentication**: None (Public)
- **Response Format**: `application/json`

### Success Response (200 OK)

```json
{
  "status": "UP",
  "service": "FedMaintain Backend",
  "version": "1.0.0"
}
```

---

## 2. GET /actuator/health

Exposes Spring Boot Actuator subsystem probes, including database connectivity.

- **URL**: `/actuator/health`
- **Method**: `GET`
- **Authentication**: None (Public)
- **Response Format**: `application/json`

### Success Response (200 OK)

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "isValid()"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```
