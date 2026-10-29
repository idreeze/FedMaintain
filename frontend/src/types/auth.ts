export type Role = 'ADMIN' | 'ENGINEER' | 'OPERATOR';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

export interface ActuatorHealthResponse {
  status: string;
  components?: {
    db?: {
      status: string;
      details?: {
        database?: string;
        validationQuery?: string;
      };
    };
    diskSpace?: {
      status: string;
    };
    ping?: {
      status: string;
    };
  };
}
