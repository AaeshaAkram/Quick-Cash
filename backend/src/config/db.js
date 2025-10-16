import { createPool } from 'mysql2/promise';

export const pool = createPool({
  // Defaults align with docker-compose MySQL for smoother local dev
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || 'atm_user',
  password: process.env.DB_PASSWORD || 'atm_password',
  database: process.env.DB_NAME || 'atm_simulator',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: true
});


