import { Router } from 'express';
import { AuthController } from '../controllers/authController';

export const authRoutes = Router();

authRoutes.post('/sync-profile', AuthController.syncProfile);
authRoutes.get('/personas', AuthController.getDemoPersonas);
