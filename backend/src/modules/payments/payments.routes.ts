import { Router } from 'express';
import { authenticate } from '../auth/authenticate';
import { stardustRateLimiter } from '../../middleware/rateLimiters';
import * as PaymentsController from './payments.controller';

const router = Router();

// Public — PayPal webhook (sin autenticación; la firma se verifica en el service).
// Debe declararse ANTES que las rutas autenticadas.
router.post('/paypal/webhook', PaymentsController.paypalWebhook);

// Protected - donations (read-only: los pagos se procesan vía PayPal)
router.get('/donations/me', authenticate, PaymentsController.getDonations);
router.get('/donations/sent', authenticate, PaymentsController.getDonationsSent);
router.get('/donations/stats', authenticate, PaymentsController.getDonationStats);

// Protected - PayPal Gateway
router.post('/paypal/create-order', stardustRateLimiter, authenticate, PaymentsController.preparePayPal);
router.post('/paypal/capture-order', stardustRateLimiter, authenticate, PaymentsController.confirmPayPal);

export default router;
