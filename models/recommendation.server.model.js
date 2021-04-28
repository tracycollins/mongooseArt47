const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AutoIncrement = require("mongoose-sequence")(mongoose);

exports.RecommendationSchema = new Schema({
  // id: { type: String, unique: true, lowercase: true },
  artwork: { type: Schema.Types.ObjectId, ref: "Artwork" },
  user: { type: Schema.Types.ObjectId, ref: "User" },
  network: { type: Schema.Types.ObjectId, ref: "NeuralNetwork" },
  networkId: { type: String },
  score: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now() },
}).plugin(AutoIncrement, { id: "recommendation_id_counter", inc_field: "id" });
