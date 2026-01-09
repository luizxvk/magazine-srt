import express from 'express';
import {
  getListings,
  getMyListings,
  createListing,
  buyItem,
  cancelListing,
  getTransactionHistory,
  getMarketStats,
} from '../controllers/marketController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Market routes
router.get('/listings', getListings);
router.get('/my-listings', getMyListings);
router.post('/listings', createListing);
router.post('/buy/:listingId', buyItem);
router.delete('/listings/:listingId', cancelListing);
router.get('/transactions', getTransactionHistory);
router.get('/stats', getMarketStats);

export default router;
