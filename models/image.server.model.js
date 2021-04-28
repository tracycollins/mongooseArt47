const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.ImageSchema = new Schema({
  id: { type: String, unique: true, lowercase: true },
  title: { type: String },
  fileName: { type: String },
  description: { type: String },
  url: { type: String },
  imageAnalysis: { type: String },
  img: { data: Buffer, contentType: String },
  createdAt: { type: Date, default: Date.now() },
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
});
