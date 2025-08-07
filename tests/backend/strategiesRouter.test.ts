import request from 'supertest';
import express from 'express';
import strategiesRouter from '../../backend/src/routes/strategies';
import db from '../../backend/src/database/connection';

const app = express();
app.use(express.json());
app.use('/api/strategies', strategiesRouter);

describe('Strategies Router', () => {
  beforeAll(async () => {
    // Ensure migrations are run before tests
    try {
      await db.migrate.latest({ directory: './backend/database/migrations' });
    } catch (error) {
      // Migrations may already be applied
      console.warn('Migration warning:', error);
    }
  });

  beforeEach(async () => {
    // Clear strategies table before each test
    await db('strategies').del();
  });

  afterAll(async () => {
    // Clean up database connection
    await db.destroy();
  });

  describe('GET /api/strategies', () => {
    it('should return empty array when no strategies exist', async () => {
      const response = await request(app)
        .get('/api/strategies')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    it('should return strategies with correct fields', async () => {
      // Insert test strategy directly into database
      await db('strategies').insert({
        name: 'Test Strategy',
        code: 'close > sma(close, 20)',
        config: {},
        status: 'inactive',
      });

      const response = await request(app)
        .get('/api/strategies')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name', 'Test Strategy');
      expect(response.body.data[0]).toHaveProperty('code', 'close > sma(close, 20)');
      expect(response.body.data[0]).toHaveProperty('created_at');
      expect(response.body.data[0]).toHaveProperty('updated_at');
      // Should not have config, status, etc. in response
      expect(response.body.data[0]).not.toHaveProperty('config');
      expect(response.body.data[0]).not.toHaveProperty('status');
    });
  });

  describe('POST /api/strategies', () => {
    it('should create a new strategy', async () => {
      const strategyData = {
        name: 'My Strategy',
        code: 'rsi(close, 14) < 30',
      };

      const response = await request(app)
        .post('/api/strategies')
        .send(strategyData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('name', 'My Strategy');
      expect(response.body.data).toHaveProperty('code', 'rsi(close, 14) < 30');
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).toHaveProperty('updated_at');
    });

    it('should return 400 for missing name', async () => {
      const strategyData = {
        code: 'rsi(close, 14) < 30',
      };

      const response = await request(app)
        .post('/api/strategies')
        .send(strategyData)
        .expect(400);

      expect(response.body.error).toContain('name');
    });

    it('should return 400 for missing code', async () => {
      const strategyData = {
        name: 'My Strategy',
      };

      const response = await request(app)
        .post('/api/strategies')
        .send(strategyData)
        .expect(400);

      expect(response.body.error).toContain('code');
    });

    it('should return 409 for duplicate strategy name', async () => {
      const strategyData = {
        name: 'Duplicate Strategy',
        code: 'close > open',
      };

      // Create first strategy
      await request(app)
        .post('/api/strategies')
        .send(strategyData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/strategies')
        .send(strategyData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('PUT /api/strategies/:id', () => {
    let strategyId: number;

    beforeEach(async () => {
      // Create a test strategy
      const [id] = await db('strategies').insert({
        name: 'Test Strategy',
        code: 'close > open',
        config: {},
        status: 'inactive',
      });
      strategyId = id;
    });

    it('should update an existing strategy', async () => {
      const updateData = {
        name: 'Updated Strategy',
        code: 'close > sma(close, 50)',
      };

      const response = await request(app)
        .put(`/api/strategies/${strategyId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', strategyId);
      expect(response.body.data).toHaveProperty('name', 'Updated Strategy');
      expect(response.body.data).toHaveProperty('code', 'close > sma(close, 50)');
    });

    it('should return 404 for non-existent strategy', async () => {
      const updateData = {
        name: 'Updated Strategy',
        code: 'close > sma(close, 50)',
      };

      await request(app)
        .put('/api/strategies/9999')
        .send(updateData)
        .expect(404);
    });

    it('should return 400 for invalid ID', async () => {
      const updateData = {
        name: 'Updated Strategy',
        code: 'close > sma(close, 50)',
      };

      await request(app)
        .put('/api/strategies/invalid')
        .send(updateData)
        .expect(400);
    });
  });

  describe('DELETE /api/strategies/:id', () => {
    let strategyId: number;

    beforeEach(async () => {
      // Create a test strategy
      const [id] = await db('strategies').insert({
        name: 'Test Strategy',
        code: 'close > open',
        config: {},
        status: 'inactive',
      });
      strategyId = id;
    });

    it('should delete an existing strategy', async () => {
      const response = await request(app)
        .delete(`/api/strategies/${strategyId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verify strategy is deleted
      const strategy = await db('strategies').where('id', strategyId).first();
      expect(strategy).toBeUndefined();
    });

    it('should return 404 for non-existent strategy', async () => {
      await request(app)
        .delete('/api/strategies/9999')
        .expect(404);
    });

    it('should return 400 for invalid ID', async () => {
      await request(app)
        .delete('/api/strategies/invalid')
        .expect(400);
    });
  });
});
