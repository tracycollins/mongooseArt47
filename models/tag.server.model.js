const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.TagSchema = new Schema({
  // _id: Schema.Types.ObjectId,
	id: { type: String, unique: true, lowercase: true },
	createdAt: { type: Date, default: Date.now() },
});
