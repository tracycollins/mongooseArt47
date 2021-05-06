const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.NetworkInputSchema = new Schema({
  id: { type: String, unique: true, lowercase: true },
  numInputs: { type: Number, default: 100 },
  image: { type: mongoose.Schema.Types.Mixed },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  inputs: { type: mongoose.Schema.Types.Mixed, default: [] },
  networks: [{ type: Schema.Types.ObjectId, ref: "Network" }],
  stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now() },
});
