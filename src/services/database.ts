import { Pool } from 'pg';
import { Logger } from '../utils/logger';

export class DatabaseService {
  private pool: Pool;
  private logger: Logger;

  constructor() {
    this.logger = new Logger();
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'chart_service',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      max: parseInt(process.env.DB_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  async initialize(): Promise<void> {
    try {
      const client = await this.pool.connect();
      this.logger.info('Database connected successfully');

      // Create tables if they don't exist
      await this.createTables();

      client.release();
    } catch (error) {
      this.logger.error('Failed to initialize database', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    const queries = [
      `
      CREATE TABLE IF NOT EXISTS charts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_hash VARCHAR(32) UNIQUE NOT NULL,
        title VARCHAR(255),
        description TEXT,
        chart_type VARCHAR(50) NOT NULL,
        chart_config JSONB NOT NULL,
        chart_data JSONB NOT NULL,
        width INTEGER DEFAULT 800,
        height INTEGER DEFAULT 600,
        theme VARCHAR(50) DEFAULT 'light',
        is_public BOOLEAN DEFAULT false,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS chart_access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chart_id UUID REFERENCES charts(id) ON DELETE CASCADE,
        ip_address INET,
        user_agent TEXT,
        access_type VARCHAR(20) NOT NULL,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_charts_hash ON charts(chart_hash);
      CREATE INDEX IF NOT EXISTS idx_charts_public ON charts(is_public) WHERE is_public = true;
      CREATE INDEX IF NOT EXISTS idx_access_logs_chart ON chart_access_logs(chart_id);
      CREATE INDEX IF NOT EXISTS idx_access_logs_date ON chart_access_logs(accessed_at);
      `
    ];

    for (const query of queries) {
      await this.pool.query(query);
    }

    this.logger.info('Database tables created/verified');
  }

  getPool(): Pool {
    return this.pool;
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      this.logger.debug('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error('Query failed', { text, duration, error });
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    this.logger.info('Database connection pool closed');
  }
}