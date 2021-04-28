const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.MediaSchema = new Schema({
	id: { type: String, unique: true },
	title: { type: String},
	description: { type: String },
	url: { type: String},
	mediaUrl: { type: String},
  img: { data: Buffer, contentType: String },
	width: { type: Number },
	height: { type: Number },
	createdAt: { type: Date, default: Date.now() },
	tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }]
});
