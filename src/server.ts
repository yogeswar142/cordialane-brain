import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cordia';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log(`✅ Connected to MongoDB at ${MONGO_URI}`);

    // Start Express listener
    app.listen(PORT, () => {
      console.log(`🚀 Cordia API server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
