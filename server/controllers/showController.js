import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Configure axios for TMDB with retry logic
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000,
  retry: 3,
  retryDelay: 1000
});

// Add retry interceptor
tmdbApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    if (!config || !config.retry) return Promise.reject(error);
    
    if (
      error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      (error.response && error.response.status >= 500)
    ) {
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < config.retry) {
        config.__retryCount += 1;
        
        await new Promise(resolve => 
          setTimeout(resolve, config.retryDelay * config.__retryCount)
        );
        
        return tmdbApi(config);
      }
    }
    
    return Promise.reject(error);
  }
);

export const addShow = async (req, res) => {
  try {
    const {movieId, showInput, showPrice} = req.body;

    let movie = await Movie.findById(movieId);
    if (!movie) {
      try {
        // Fetch movie details and credits from TMDB
        const [movieResponse, creditsResponse] = await Promise.all([
          tmdbApi.get(`/movie/${movieId}`),
          tmdbApi.get(`/movie/${movieId}/credits`)
        ]);

        const movieApiData = movieResponse.data;
        const movieCreditsData = creditsResponse.data;

        const movieDetails = {
          _id: movieId,
          title: movieApiData.title,
          overview: movieApiData.overview,
          poster_path: movieApiData.poster_path,
          backdrop_path: movieApiData.backdrop_path,
          genres: movieApiData.genres,
          casts: movieCreditsData.cast,
          release_date: movieApiData.release_date,
          original_language: movieApiData.original_language,
          tagline: movieApiData.tagline || "",
          vote_average: movieApiData.vote_average,
          runtime: movieApiData.runtime,
        }

        movie = await Movie.create(movieDetails);
      } catch (apiError) {
        console.error('TMDB API Error:', apiError.message);
        
        if (apiError.code === 'ECONNRESET' || apiError.code === 'ETIMEDOUT') {
          return res.status(503).json({
            success: false, 
            message: "Movie database temporarily unavailable. Please try again later."
          });
        }
        
        return res.status(500).json({
          success: false, 
          message: "Failed to fetch movie details. Please try again."
        });
      }
    }

    const showsToCreate = [];
    showInput.forEach(({ date, time }) => {
      // time is an array of time strings for this date
      if (Array.isArray(time)) {
        time.forEach(timeStr => {
          const dateTimeString = `${date}T${timeStr}:00`;
          showsToCreate.push({
            movie: movie._id,
            showDateTime: new Date(dateTimeString),
            showPrice,
            occupiedSeats: {}
          });
        });
      } else {
        // Handle single time (fallback)
        const dateTimeString = `${date}T${time}:00`;
        showsToCreate.push({
          movie: movie._id,
          showDateTime: new Date(dateTimeString),
          showPrice,
          occupiedSeats: {}
        });
      }
    });

    if(showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }

    await inngest.send({
      name: 'app/show.added',
      data: {
        movieTitle: movie.title,
      }
    })

    res.json({success: true, message: "Shows added successfully"});

  }catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: error.message});
  }
}

export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({showDateTime: 1});

    const uniqueShows = new Set(shows.map(show => show.movie));

    res.json({
      success: true,
      shows: Array.from(uniqueShows)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: error.message});
  }
}

export const getShow = async (req, res) => {
  try {
    const {movieId} = req.params;
    const shows = await Show.find({movie: movieId, showDateTime: {$gte: new Date()}});
    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach(show => {
      const date = show.showDateTime.toISOString().split('T')[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id
      })
    });
    res.json({
      success: true,
      movie,
      dateTime
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: error.message});
    
  }
}