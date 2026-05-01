export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_dev';
export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';
export const JWT_REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;
