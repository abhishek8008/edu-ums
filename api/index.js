/**
 * Vercel Serverless Function — wraps the Express app
 * Vercel routes all /api/* requests here via vercel.json
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Cache the DB connection across warm invocations
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });
  isConnected = true;
}

const app = require('../app');

// Wrap the Express app to ensure DB is connected before handling requests
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
