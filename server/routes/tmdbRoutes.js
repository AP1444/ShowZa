import express from 'express';
import { 
  getUpcomingTrailers, 
  searchMovies, 
  getMovieDetails, 
  getMovieVideos 
} from '../controllers/tmdbController.js';

const router = express.Router();

// Get upcoming movie trailers
router.get('/trailers', getUpcomingTrailers);

// Search movies with filters
router.get('/search', searchMovies);

// Get movie details
router.get('/movie/:movieId', getMovieDetails);

// Get movie videos
router.get('/movie/:movieId/videos', getMovieVideos);

export default router;
