import express, { Request, Response } from 'express';
import db from '../database/connection';

const router = express.Router();

// GET /api/strategies - Get all strategies
router.get('/', async (req: Request, res: Response) => {
  try {
    const strategies = await db('strategies')
      .select('id', 'name', 'code', 'created_at', 'updated_at')
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: strategies,
    });
  } catch (error) {
    console.error('Error fetching strategies:', error);
    res.status(500).json({
      error: 'Failed to fetch strategies',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/strategies - Create a new strategy
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: name',
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: code',
      });
    }

    // Check if strategy with this name already exists
    const existingStrategy = await db('strategies')
      .where('name', name)
      .first();

    if (existingStrategy) {
      return res.status(409).json({
        error: 'Strategy with this name already exists',
      });
    }

    // Insert new strategy
    const [strategyId] = await db('strategies')
      .insert({
        name: name.trim(),
        code: code.trim(),
        config: {}, // Keep existing structure for compatibility
        status: 'inactive', // Keep existing structure for compatibility
      });

    // Fetch the created strategy
    const newStrategy = await db('strategies')
      .select('id', 'name', 'code', 'created_at', 'updated_at')
      .where('id', strategyId)
      .first();

    res.status(201).json({
      success: true,
      data: newStrategy,
    });
  } catch (error) {
    console.error('Error creating strategy:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'Strategy with this name already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to create strategy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/strategies/:id - Update an existing strategy
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid strategy ID',
      });
    }

    const strategyId = parseInt(id);

    // Check if strategy exists
    const existingStrategy = await db('strategies')
      .where('id', strategyId)
      .first();

    if (!existingStrategy) {
      return res.status(404).json({
        error: 'Strategy not found',
      });
    }

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: name',
      });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required field: code',
      });
    }

    // Check if another strategy with this name already exists (excluding current strategy)
    const duplicateStrategy = await db('strategies')
      .where('name', name)
      .whereNot('id', strategyId)
      .first();

    if (duplicateStrategy) {
      return res.status(409).json({
        error: 'Strategy with this name already exists',
      });
    }

    // Update strategy
    await db('strategies')
      .where('id', strategyId)
      .update({
        name: name.trim(),
        code: code.trim(),
        updated_at: db.fn.now(),
      });

    // Fetch updated strategy
    const updatedStrategy = await db('strategies')
      .select('id', 'name', 'code', 'created_at', 'updated_at')
      .where('id', strategyId)
      .first();

    res.json({
      success: true,
      data: updatedStrategy,
    });
  } catch (error) {
    console.error('Error updating strategy:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: 'Strategy with this name already exists',
      });
    }

    res.status(500).json({
      error: 'Failed to update strategy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/strategies/:id - Delete a strategy
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid strategy ID',
      });
    }

    const strategyId = parseInt(id);

    // Check if strategy exists
    const existingStrategy = await db('strategies')
      .where('id', strategyId)
      .first();

    if (!existingStrategy) {
      return res.status(404).json({
        error: 'Strategy not found',
      });
    }

    // Delete strategy
    await db('strategies')
      .where('id', strategyId)
      .delete();

    res.json({
      success: true,
      message: 'Strategy deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    res.status(500).json({
      error: 'Failed to delete strategy',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
