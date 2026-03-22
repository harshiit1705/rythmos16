const mongoose = require("mongoose");

// async function connectDB() {
//   const uri = process.env.MONGODB_URI;
//   if (!uri) {
//     throw new Error("Missing MONGODB_URI in environment variables");
//   }

//   mongoose.set("strictQuery", true);
//   await mongoose.connect(uri);
//   console.log("MongoDB connected");
// }

// module.exports = { connectDB };


async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI in environment variables");
    }

    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);

    console.log(" MongoDB connected");
  } catch (err) {
    console.error(" DB Connection Error:", err.message);
    throw err;
  }
}

module.exports = { connectDB };