// User Roles
const ROLES = {
  ADMIN: 'Admin',
  FACULTY: 'Faculty',
  STUDENT: 'Student',
};

// Role Permissions
const ROLE_PERMISSIONS = {
  Admin: ['read', 'create', 'update', 'delete', 'manage_users'],
  Faculty: ['read', 'create', 'update'],
  Student: ['read'],
};

// HTTP Status Codes
const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'User already exists',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_REQUIRED: 'Token is required',
  INTERNAL_ERROR: 'Internal server error',
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  STATUS_CODES,
  ERROR_MESSAGES,
};
