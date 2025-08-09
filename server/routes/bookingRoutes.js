import express from 'express';
import { createBooking, getOccupiedSeats, getTopBookedMovie } from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Create a new booking
router.post('/create', requireAuth, createBooking);

// Get occupied seats for a specific show
router.get('/occupied-seats/:showId', requireAuth, getOccupiedSeats);

// Get movie with highest total bookings
router.get('/top-movie', getTopBookedMovie);

export default router;