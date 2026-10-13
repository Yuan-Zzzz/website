import mongoose from "mongoose";

const GameSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  itchUrl: {
    type: String,
    required: false,
    default: "",
  },
  steamAppId: {
    type: Number,
    required: false,
    sparse: true,
    unique: true,
  },
  steamUrl: {
    type: String,
    required: false,
    default: "",
  },
  featured: {
    type: Boolean,
    default: false,
  },
  tags: [
    {
      type: String,
    },
  ],
  order: {
    type: Number,
    default: 0,
  },
  published: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Game || mongoose.model("Game", GameSchema);
