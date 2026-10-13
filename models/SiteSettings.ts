import mongoose from "mongoose";

const SiteSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: "site",
  },
  aboutTitle: {
    type: String,
    required: true,
    default: "关于我",
  },
  aboutBody: {
    type: String,
    required: true,
    default: "",
  },
  aboutTags: [
    {
      type: String,
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.SiteSettings ||
  mongoose.model("SiteSettings", SiteSettingsSchema);
