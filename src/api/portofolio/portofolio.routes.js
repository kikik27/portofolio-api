const express = require('express');
const { getPortfolio, createPortfolio, updatePortfolio, deletePortfolio } = require('./portofolio.services');
const { check, validationResult } = require('express-validator');
const { diskStorage, sendResponse } = require('../../utils/globalFunction');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();


router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, ...params } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const filters = {};

    if (params.title) {
      filters.title = {
        contains: params.title,
      };
    }

    if (params.content) {
      filters.content = {
        contains: params.content,
      };
    }

    if (params.createdAt) {
      filters.createdAt = {
        gte: new Date(params.createdAt).toISOString(),
      };
    }

    if (params.updatedAt) {
      filters.updatedAt = {
        gte: new Date(params.updatedAt).toISOString(),
      };
    }

    filters.status = true;

    const portfolio = await getPortfolio(pageNum, limitNum, filters);

    if (portfolio.length === 0) {
      return res.status(404).json({ errors: [{ msg: 'Portfolio not found' }] });
    }

    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});


router.post(
  '/',
  multer({ storage: diskStorage }).single("image"),
  [
    check('title').notEmpty().withMessage('Title is required'),
    check('content').notEmpty().withMessage('Content is required'),
    check('status').notEmpty().withMessage('Status is required').isBoolean(),
    check('image').custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Image is required');
      }
      return true;
    }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        }
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ errors: [{ msg: 'Image is required' }] });
      }

      const file = req.file;

      const payload = {
        ...req.body,
        status: req.body.status === 'true' || req.body.status === '1',
        image: path.relative(process.cwd(), file.path),
      };

      const portfolio = await createPortfolio(payload);
      sendResponse(res, 201, 'Portfolio created successfully', portfolio);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id', async (req, res, next) => {
  try {
    const portfolio = await updatePortfolio(req.params.id, req.body);
    sendResponse(res, 200, 'Portfolio updated successfully', portfolio);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const portfolio = await deletePortfolio(req.params.id);
    sendResponse(res, 200, 'Portfolio deleted successfully', portfolio);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
