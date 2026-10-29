# Asset Hierarchy REST API Reference

All requests require JWT Bearer Authentication in the `Authorization: Bearer <token>` header.

---

## Plants API (`/api/plants`)

### 1. List All Plants
- **Endpoint**: `GET /api/plants`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "code": "BLR-01",
    "name": "Bengaluru Fab 1",
    "location": "Whitefield Semiconductor Park, Bengaluru, India",
    "description": "Advanced 300mm Semiconductor Fabrication Facility",
    "status": "ACTIVE",
    "createdAt": "2026-09-19T18:00:00Z",
    "updatedAt": "2026-09-19T18:00:00Z"
  }
]
```

### 2. Get Plant by ID
- **Endpoint**: `GET /api/plants/{id}`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK`

### 3. Register Plant
- **Endpoint**: `POST /api/plants`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Request Body**:
```json
{
  "code": "SGP-01",
  "name": "Singapore Advanced Foundry 1",
  "location": "Woodlands, Singapore",
  "description": "300mm Cleanroom Facility"
}
```
- **Response**: `201 Created`

### 4. Update Plant
- **Endpoint**: `PUT /api/plants/{id}`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Response**: `200 OK`

### 5. Delete Plant
- **Endpoint**: `DELETE /api/plants/{id}`
- **Roles Allowed**: `ADMIN`
- **Response**: `204 No Content`

---

## Production Areas API (`/api`)

### 1. List Areas by Plant
- **Endpoint**: `GET /api/plants/{plantId}/areas`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`

### 2. Create Area inside Plant
- **Endpoint**: `POST /api/plants/{plantId}/areas`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Request Body**:
```json
{
  "code": "CMP-BAY-02",
  "name": "Chemical Mechanical Planarization Bay 2",
  "description": "Secondary polishing cleanroom"
}
```
- **Response**: `201 Created`

### 3. Update Area
- **Endpoint**: `PUT /api/areas/{id}`
- **Roles Allowed**: `ADMIN`, `ENGINEER`

### 4. Delete Area
- **Endpoint**: `DELETE /api/areas/{id}`
- **Roles Allowed**: `ADMIN`, `ENGINEER`

---

## Machines API (`/api`)

### 1. Query & Filter Machines
- **Endpoint**: `GET /api/machines`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Query Parameters**:
  - `search` (string): Filters across machine code, name, model, serial.
  - `plantId` (number): Filters by plant.
  - `areaId` (number): Filters by production area.
  - `status` (string): `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `WARNING`, `CRITICAL`, `DECOMMISSIONED`.
  - `criticality` (string): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
  - `page` (number, default: 0)
  - `size` (number, default: 20)
  - `sortBy` (string, default: `createdAt`)
  - `direction` (string, default: `desc`)
- **Response**: `200 OK` (`PageResponse<MachineResponse>`)

### 2. Get Machine Details
- **Endpoint**: `GET /api/machines/{id}`
- **Roles Allowed**: `ADMIN`, `ENGINEER`, `OPERATOR`

### 3. Register New Machine
- **Endpoint**: `POST /api/areas/{areaId}/machines`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Request Body**:
```json
{
  "machineCode": "CMP-002",
  "name": "Applied Materials Reflexion LK Secondary",
  "machineType": "CMP",
  "manufacturer": "Applied Materials",
  "modelNumber": "Reflexion LK",
  "serialNumber": "AMAT-2024-CMP-902",
  "criticality": "HIGH"
}
```
- **Response**: `201 Created`

### 4. Update Machine Status
- **Endpoint**: `PATCH /api/machines/{id}/status`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Request Body**:
```json
{
  "status": "MAINTENANCE"
}
```
- **Response**: `200 OK`

### 5. Decommission Machine (Soft Delete)
- **Endpoint**: `DELETE /api/machines/{id}`
- **Roles Allowed**: `ADMIN`, `ENGINEER`
- **Response**: `204 No Content`
