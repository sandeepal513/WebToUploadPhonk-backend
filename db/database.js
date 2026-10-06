const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/phonk_hub';
    const conn = await mongoose.connect(connStr);
    console.log(`🍃 MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // If local MongoDB service is not running yet, log helpful warning instead of crashing app completely
    console.warn('👉 Make sure MongoDB service (mongod) is running locally or provide a valid MONGODB_URI in .env');
  }
};

module.exports = connectDB;
