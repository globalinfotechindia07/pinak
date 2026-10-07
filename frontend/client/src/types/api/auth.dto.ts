export type UserRole = "CUSTOMER" | "MERCHANT" | "ADMIN";

export interface UserDTO {
  id: string;
  phone?: string;
  mobile?: string;
  email: string;
  name?: string;
  role: UserRole;
  status: string;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  profilePictureUrl?: string;
  staffScope?: string;
  staffRoleId?: string;
  staffRoleName?: string;
  merchantId?: string;
  storeId?: string;
  permissions?: string;
  createdAt?: string;
}

export interface LoginRequest {
  identifier?: string;
  email?: string;
  password?: string;
  deviceId?: string;
  deviceName?: string;
  role?: UserRole;
}

export interface OtpRequest {
  phone: string;
  purpose: "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: UserDTO;
  tokens: AuthTokens;
  merchantId?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
