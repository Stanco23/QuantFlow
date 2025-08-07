import express from 'express';
import { parseDSL } from '@quantflow/shared';

const router = express.Router();

/**
 * POST /api/parser/validate
 * Validates DSL code and returns AST with any parsing errors
 */
router.post('/validate', (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        ast: null,
        errors: ['No code provided in request body']
      });
    }

    const { ast, errors } = parseDSL(code);
    
    res.json({
      ast,
      errors
    });
  } catch (error) {
    console.error('Parser validation error:', error);
    res.status(500).json({
      ast: null,
      errors: ['Internal server error during parsing']
    });
  }
});

export default router;
