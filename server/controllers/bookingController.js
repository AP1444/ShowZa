import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import stripe from "stripe";

// Get the movie with highest total bookings
export const getTopBookedMovie = async (req, res) => {
  try {
    // Aggregate bookings by movie to find the most booked one
    const topMovie = await Booking.aggregate([
      {
        $match: {
          isPaid: true // Only count paid bookings
        }
      },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'showData'
        }
      },
      {
        $unwind: '$showData'
      },
      {
        $lookup: {
          from: 'movies',
          localField: 'showData.movie',
          foreignField: '_id',
          as: 'movieData'
        }
      },
      {
        $unwind: '$movieData'
      },
      {
        $group: {
          _id: '$movieData._id',
          totalBookings: { $sum: 1 },
          totalSeats: { $sum: { $size: '$bookedSeats' } },
          totalRevenue: { $sum: '$amount' },
          movie: { $first: '$movieData' }
        }
      },
      {
        $sort: { totalBookings: -1 }
      },
      {
        $limit: 1
      }
    ]);

    if (topMovie.length === 0) {
      // If no bookings exist, return a default popular movie from shows
      const defaultShow = await Show.findOne().populate('movie').sort({ createdAt: -1 });
      if (defaultShow) {
        return res.json({
          success: true,
          movie: {
            ...defaultShow.movie.toObject(),
            totalBookings: 0,
            totalSeats: 0,
            totalRevenue: 0
          }
        });
      } else {
        return res.status(404).json({ success: false, message: 'No movies found' });
      }
    }

    res.json({
      success: true,
      movie: {
        ...topMovie[0].movie,
        totalBookings: topMovie[0].totalBookings,
        totalSeats: topMovie[0].totalSeats,
        totalRevenue: topMovie[0].totalRevenue
      }
    });

  } catch (error) {
    console.error('Error getting top booked movie:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


const checkSeatAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);
    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats;

    const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);
    return !isAnySeatTaken;

  } catch (error) {
    console.error(`Error checking seat availability for show ${showId}:`, error);
    return false;
  }
}

export const createBooking = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { showId, selectedSeats } = req.body;
    const {origin } = req.headers;

    const isAvailable = await checkSeatAvailability(showId, selectedSeats);
    if (!isAvailable) {
      return res.status(400).json({ success: false, message: 'Selected seats are not available' });
    }

    const showData = await Show.findById(showId).populate('movie');

    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    })

    selectedSeats.map((seat) => {
      showData.occupiedSeats[seat] = userId;
    })

    showData.markModified('occupiedSeats');
    await showData.save();

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: showData.movie.title,
        },
        unit_amount: Math.floor(booking.amount) * 100
      },
      quantity: 1,
    }]

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      line_items,
      mode: 'payment',
      metadata: {
        bookingId: booking._id.toString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    })

    booking.paymentLink = session.url;
    await booking.save();

    await inngest.send({
      name: 'app/checkpayment',
      data: {
        bookingId: booking._id.toString(),
      }
    })


    res.json({
      success: true,
      url: session.url,
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    const occupiedSeats = Object.keys(showData.occupiedSeats);
    res.json({success: true,  occupiedSeats });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
}