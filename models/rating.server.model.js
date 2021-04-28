const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AutoIncrement = require('mongoose-sequence')(mongoose);

exports.RatingSchema = new Schema({
	//
	// using mongoose-sequence module to create auto-incrementing index on id field
	//
	// id: { type: String, unique: true, lowercase: true },

  artwork: { type: Schema.Types.ObjectId, ref: 'Artwork' },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
	rate: { type: Number, default: 0 },
	createdAt: { type: Date, default: Date.now() }
}).plugin(AutoIncrement, { id: 'rating_id_counter', inc_field: 'id'});
