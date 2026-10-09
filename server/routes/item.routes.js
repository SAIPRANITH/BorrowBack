import express from 'express';
import {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  toggleVisibility,
} from '../controllers/item.controller.js';
import { protect } from '../middleware/auth.js';
import { upload, uploadToS3 } from '../middleware/upload.js';

const router = express.Router();

router.route('/')
  .get(getItems)
  .post(protect, upload.single('image'), uploadToS3, createItem);

router.get('/mine', protect, getMyItems);

router.route('/:id')
  .get(getItemById)
  .put(protect, upload.single('image'), uploadToS3, updateItem)
  .delete(protect, deleteItem);

router.put('/:id/toggle', protect, toggleVisibility);

export default router;
