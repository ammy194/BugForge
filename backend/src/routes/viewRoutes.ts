import { Router } from 'express';
import { ViewController } from '../controllers/viewController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const viewRoutes = Router();

viewRoutes.use(requireAuth);

viewRoutes.get('/', asyncHandler(ViewController.getSavedViews));
viewRoutes.post('/', asyncHandler(ViewController.createSavedView));
viewRoutes.delete('/:id', asyncHandler(ViewController.deleteSavedView));
