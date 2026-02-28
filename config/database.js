const mongoose = require('mongoose');

/**
 * Connect to MongoDB (local or Atlas).
 * Mongoose 7+ no longer needs useNewUrlParser / useUnifiedTopology.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(uri, {
      // Atlas-friendly defaults
      serverSelectionTimeoutMS: 10000,   // fail fast if cluster unreachable
      socketTimeoutMS: 45000,            // close sockets after 45 s inactivity
      maxPoolSize: 10,                   // connection-pool ceiling
    });

    console.log(
      `MongoDB connected: ${conn.connection.host} (db: ${conn.connection.name})`
    );

    // Surface connection errors that happen after initial connect
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected — will auto-reconnect');
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

