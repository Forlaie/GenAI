import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

const uri = process.env.MONGODB_URI;
let cached: {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} = {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 5000,
      })
      .then((mongoose) => {
        return mongoose;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Character Schema
const CharacterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    position_x: {
      type: Number,
      default: 50,
    },
    position_y: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  },
);

// Export model
export const Character =
  mongoose.models.Character || mongoose.model("Character", CharacterSchema);
export const isMongoConfigured = !!process.env.MONGODB_URI;
