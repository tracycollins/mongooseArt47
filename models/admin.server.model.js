const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.AdminSchema = new Schema({
  nodeType: { type: String, default: "user" },
  nodeId: { type: String, unique: true, lowercase: true },
  oauthID: { type: Number, default: 0 },
  role: { type: String, default: "" },
  screenName: { type: String, default: "", lowercase: true },
  name: { type: String, default: "" },
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  url: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now() },
  lastSeen: { type: Date, default: Date.now() },
  sessions: { type: [String], trim: true },
});
