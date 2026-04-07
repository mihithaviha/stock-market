const mongoose = require('mongoose');

const connectDB = async (url) => {
  if (!url) {
    console.warn("No MONGO_URI provided. MongoDB connection skipped.");
    return;
  }
  return mongoose.connect(url);
};

module.exports = connectDB;
