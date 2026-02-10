import express from 'express';
import {
  getListings,
  getMyListings,
  createListing,
  buyItem,
  cancelListing,
  getTransactionHistory,
  getMarketStats,
  // Market 6.0 features
  getFavorites,
  addFavorite,
  removeFavorite,
  getOffersReceived,
  getOffersSent,
  makeOffer,
  acceptOffer,
  rejectOffer,
  cancelOffer,
  featureListing,
  toggleEliteOnly,
} from '../controllers/marketController';
import { authenticateToken } from '../middleware/authMiddleware';
import { moderateTextContent } from '../middleware/moderationMiddleware';

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

// Market 6.0 - Favorites
router.get('/favorites', getFavorites);
router.post('/favorites/:listingId', addFavorite);
router.delete('/favorites/:listingId', removeFavorite);

// Market 6.0 - Offers
router.get('/offers/received', getOffersReceived);
router.get('/offers/sent', getOffersSent);
router.post('/offers/:listingId', moderateTextContent(['message']), makeOffer);
router.post('/offers/:offerId/accept', acceptOffer);
router.post('/offers/:offerId/reject', rejectOffer);
router.delete('/offers/:offerId', cancelOffer);

// Market 6.0 - Feature & Elite
router.post('/listings/:listingId/feature', featureListing);
router.post('/listings/:listingId/elite-only', toggleEliteOnly);

export default router;
