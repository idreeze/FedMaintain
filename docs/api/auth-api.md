# Authentication & Security API Specification — FedMaintain

All protected endpoints require the HTTP header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. User Registration

Registers a new user account. Passwords must be at least 8 characters.

- **URL**: `POST /api/auth/register`
- **Authentication**: None (Public)
- **Request Headers**: `Content-Type: application/json`

### Request Body
```json
{
  "name": "John Engineer",
  "email": "john@fedmaintain.com",
  "password": "Password@123",
  "role": "ENGINEER"
}
```

### Success Response (201 Created)
```json
{
  "message": "User registered successfully"
}
```

### Error Responses
- **400 Bad Request**: Validation error (missing fields, invalid email, password under 8 characters).
- **409 Conflict**: Email is already registered.

---

## 2. User Login

Authenticates credentials and issues a signed JSON Web Token.

- **URL**: `POST /api/auth/login`
- **Authentication**: None (Public)
- **Request Headers**: `Content-Type: application/json`

### Request Body
```json
{
  "email": "john@fedmaintain.com",
  "password": "Password@123"
}
```

### Success Response (200 OK)
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 1,
    "name": "John Engineer",
    "email": "john@fedmaintain.com",
    "role": "ENGINEER"
  }
}
```

### Error Responses
- **401 Unauthorized**: Invalid email or password.

---

## 3. Current Authenticated User

Restores the active user profile from a valid session token.

- **URL**: `GET /api/auth/me`
- **Authentication**: Required (`Bearer <token>`)

### Success Response (200 OK)
```json
{
  "id": 1,
  "name": "John Engineer",
  "email": "john@fedmaintain.com",
  "role": "ENGINEER"
}
```

### Error Responses
- **401 Unauthorized**: Missing, expired, or tampered JWT.

---

## 4. Role Authorization Verification Endpoints

Temporary verification endpoints testing Role-Based Access Control:

### `GET /api/test/admin`
- **Authorized Roles**: `ADMIN`
- **Response**: `200 OK` or `403 Forbidden`

### `GET /api/test/engineer`
- **Authorized Roles**: `ADMIN`, `ENGINEER`
- **Response**: `200 OK` or `403 Forbidden`

### `GET /api/test/operator`
- **Authorized Roles**: `ADMIN`, `ENGINEER`, `OPERATOR`
- **Response**: `200 OK` or `403 Forbidden`
