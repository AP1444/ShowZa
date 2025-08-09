# ShowZa 🎬

ShowZa is a full-stack movie booking application that allows users to browse movies, book tickets, select seats, and make payments. The application also includes an admin panel for managing shows, bookings, and viewing analytics.

## ✨ Features

### User Features
- 🎬 Browse and search movies from TMDB (The Movie Database)
- 📅 View showtimes and select preferred dates
- 🪑 Interactive seat selection with real-time availability
- 💳 Secure payment processing via Stripe
- 🎫 QR code tickets for easy verification
- ❤️ Favorite movies functionality
- 📱 Responsive design for all devices
- 🔐 User authentication via Clerk
- 📧 Email notifications for bookings

### Admin Features
- 📊 Dashboard with booking analytics
- 🎭 Add and manage movie shows
- 📋 View all bookings and revenue
- 📈 Top booked movies analytics
- 🎪 Show management with theater seat layouts

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Clerk** - User authentication
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications
- **React Player** - Video player for trailers
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Clerk Express** - Server-side authentication
- **Stripe** - Payment processing
- **Inngest** - Background job processing
- **Nodemailer** - Email service
- **QRCode** - QR code generation
- **Cloudinary** - Image management
- **CORS** - Cross-origin resource sharing

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/AP1444/ShowZa.git
cd ShowZa
```

### 2. Install Dependencies

#### Install client dependencies:
```bash
cd client
npm install
```

#### Install server dependencies:
```bash
cd ../server
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start the server:
```bash
cd server
npm run dev
```

#### In a new terminal, start the client:
```bash
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
