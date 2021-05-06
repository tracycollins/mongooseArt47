const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.NeuralNetworkSchema = new Schema({
  id: { type: String, unique: true, lowercase: true },
  networkInput: { type: Schema.Types.ObjectId, ref: "NetworkInput" },
  networkTechnology: { type: String, default: "tensorflow" },
  tensorflowModelPath: { type: String },
  networkFamily: { type: String },
  createdAt: { type: Date, default: Date.now() },
  network: { type: mongoose.Schema.Types.Mixed, default: {} },
  networkJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  numInputs: { type: Number, default: 0 },
  image: { type: mongoose.Schema.Types.Mixed },
  hiddenLayerSize: { type: Number, default: 0 },
  numOutputs: { type: Number, default: 0 },
  outputs: { type: mongoose.Schema.Types.Mixed, default: {} },
  fit: { type: mongoose.Schema.Types.Mixed, default: {} },
  test: { type: mongoose.Schema.Types.Mixed, default: {} },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
});
