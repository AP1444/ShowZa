import { Inngest } from "inngest";
import User from '../models/User.js';
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";
import QRCode from 'qrcode';

export const inngest = new Inngest({ id: "movie-ticket-booking" });

const syncUserCreation = inngest.createFunction(
  {id: 'sync-user-from-clerk'},
  {event: 'clerk/user.created'},
  async ({event}) =>{
    const {id, first_name, last_name, email_addresses, image_url} = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    }

    await User.create(userData);
  }
)

const syncUserDeletion = inngest.createFunction(
  {id: 'delete-user-with-clerk'},
  {event: 'clerk/user.deleted'},
  async ({event}) =>{
    const {id} = event.data;

    await User.findByIdAndDelete(id);
  }
)

const syncUserUpdation = inngest.createFunction(
  {id: 'update-user-with-clerk'},
  {event: 'clerk/user.updated'},
  async ({event}) =>{
    const {id, first_name, last_name, email_addresses, image_url} = event.data;
    const userData = {
      _id: id,
      email: email_addresses[0].email_address,
      name: `${first_name} ${last_name}`,
      image: image_url,
    }

    await User.findByIdAndUpdate(id, userData);
  }
)

const releaseSeatAndDeleteBooking = inngest.createFunction(
  {id: 'release-seat-and-delete-booking'},
  {event: 'app/checkpayment'},
  async ({event, step}) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

    await step.run('check-payment-status', async () => {
      const { booking_id } = event.data.bookingId;
      const booking = await Booking.findById( booking_id)

      if(!booking.isPaid){
        const show = await Show.findById(booking.show);
        booking.bookedSeats.forEach(seat => {
          delete show.occupiedSeats[seat];
        });
        show.markModified('occupiedSeats');
        await show.save();
        await Booking.findByIdAndDelete(booking._id);
      }
    })
  }
)

const sendBookingConfirmationEmail = inngest.createFunction(
  {id: 'send-booking-confirmation-email'},
  {event: 'app/show.booked'},
  async ({event, step}) => {
    const { bookingId } = event.data;
    const booking = await Booking.findById(bookingId).populate({
      path: 'show',
      populate: { path: 'movie' , model: 'Movie' }
    }).populate('user');

    // Generate QR code data with booking details
    const qrData = {
      bookingId: booking._id,
      movieTitle: booking.show.movie.title,
      showDate: booking.show.showDateTime,
      seats: booking.bookedSeats,
      userName: booking.user.name,
      userEmail: booking.user.email,
      amount: booking.amount,
      venue: 'ShowZa Cinema', // You can make this dynamic
      verificationCode: `SZ-${booking._id.toString().slice(-8).toUpperCase()}`
    };

    // Generate QR code as base64 image
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Convert data URL to buffer for attachment
    const qrCodeBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64');

    await sendEmail({
      to: booking.user.email,
      subject: `Booking Confirmation : ${booking.show.movie.title} booked!`,
      body: `<div style="font-family: Arial, sans-serif; line-height: 1.5;" >
      <h2>Hi ${booking.user.name},</h2>
      <p>Your booking for <strong style="color: #F84565;">${booking.show.movie.title}</strong> has been confirmed!</p>
      <p>
        <strong>Booking ID:</strong> ${qrData.verificationCode}<br>
        <strong>Show Date:</strong> ${new Date(booking.show.showDateTime).toLocaleDateString('en-US', {timeZone: 'Asia/Kolkata'})}<br>
        <strong>Time:</strong> ${new Date(booking.show.showDateTime).toLocaleTimeString('en-US', {timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit'})}<br>
        <strong>Seats:</strong> ${booking.bookedSeats.join(', ')}<br>
        <strong>Total Amount:</strong> $${booking.amount.toFixed(2)}<br>
      </p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px; text-align: center;">
        <h3 style="color: #F84565; margin-bottom: 10px;">Your Digital Ticket</h3>
        <p style="margin-bottom: 15px;">Show this QR code at the cinema for entry</p>
        <img src="cid:qrcode" alt="Booking QR Code" style="max-width: 250px; border: 2px solid #F84565; border-radius: 8px;" />
        <p style="margin-top: 10px; font-size: 12px; color: #666;">
          Verification Code: <strong>${qrData.verificationCode}</strong>
        </p>
      </div>
      <p><strong>Important:</strong> Please arrive at least 15 minutes before the show time. Present this QR code or your verification code at the entrance.</p>
      <p>Thank you for choosing ShowZa! We hope you enjoy the movie.</p>
      <p>Best regards,<br>The ShowZa Team</p>
      </div>`,
      attachments: [
        {
          filename: 'ticket-qrcode.png',
          content: qrCodeBuffer,
          cid: 'qrcode' // Referenced in the email HTML as cid:qrcode
        }
      ]
  })
  }
)

const sendShowReminders = inngest.createFunction(
  {id: 'send-show-reminders'},
  {cron: "0 */8 * * *"},
  async ({step}) => {
    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const shows = await Show.find({
        showDateTime: {
          $gte: windowStart,
          $lt: in8Hours
        }
      }).populate('movie');

      const tasks = [];

      for (const show of shows) {
        if(!show.movie || !show.occupiedSeats) continue;
        const userIds = [...new Set(Object.values(show.occupiedSeats))];
        if(userIds.length === 0) continue;

        const users = await User.find({_id: {$in: userIds}}).select('name email');

        for(const user of users) {
          tasks.push({
            userEmail: user.email,
            userName: user.name,
            movieTitle: show.movie.title,
            showTime: show.showTime,
          })
      }
    }
      return tasks;
  })

  if(reminderTasks.length === 0) {
    return {sent: 0, message: "No reminders to send"};
  }

  const results = await step.run("send-all-reminders", async () => {
    return await Promise.allSettled(
      reminderTasks.map(task => sendEmail({
        to: task.userEmail,
        subject: `Reminder: Your movie ${task.movieTitle} is starting soon!`,
        body: `<div style="font-family: Arial, sans-serif; padding: 20px; >
        <h2>Hi ${task.userName},</h2>
        <p>This is a friendly reminder that your movie <strong style="color: #F84565;">${task.movieTitle}</strong> is starting soon!</p>
        <p><strong>Show Time:</strong> ${new Date(task.showTime).toLocaleTimeString('en-US', {timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit'})}</p>
        <p>We hope you enjoy the show!</p>
        <p>Best regards,<br>The ShowZa Team</p>
        </div>`
      }))
    )
  })

  const sent = results.filter(result => result.status === 'fulfilled').length;
  const failed = results.length - sent;

  return { sent, failed, message: `${sent} reminder(s) sent successfully, ${failed} failed` };

})

const sendNewShowNotifications = inngest.createFunction(
  {id: 'send-new-show-notifications'},
  {event: 'app/show.added'},
  async ({event}) => {
    const { movieTitle } = event.data;

    const users = await User.find({});

    for(const user of users) {
      const userEmail = user.email;
      const userName = user.name;

      const subject = `New Show Alert: ${movieTitle} is now playing!`;
      const body = `<div style="font-family: Arial, sans-serif; padding: 20px; >
      <h2>Hi ${userName},</h2>
      <p>We are excited to inform you that a new show for <strong style="color: #F84565;">${movieTitle}</strong> has been added!</p>
      <p>Check it out now and book your tickets!</p>
      <p>Best regards,<br>The ShowZa Team</p>
      </div>`;

      await sendEmail({
        to: userEmail,
        subject,
        body,
      });
    }
    return {message: `Notifications sent to ${users.length} users for new show: ${movieTitle}`};
      
  })

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, releaseSeatAndDeleteBooking, sendBookingConfirmationEmail, sendShowReminders, sendNewShowNotifications];