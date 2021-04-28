const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AutoIncrement = require("mongoose-sequence")(mongoose);
// const ratingsAverage = require("../plugins/ratingsAverage");

exports.ArtworkSchema = new Schema({
  //
  // using mongoose-sequence module to create auto-incrementing index on id field
  //
  // id: { type: String, unique: true, lowercase: true },

  // artworkId: constructed, hopefully unique, currently <artist>/<title>.toLowerCase(), spaces -> _ i.e, 'threecee/oh_shit'
  artworkId: { type: String, unique: true, lowercase: true },
  title: { type: String },
  artist: { type: Schema.Types.ObjectId, ref: "Artist" },
  description: { type: String },
  medium: { type: String },
  url: { type: String },
  image: { type: Schema.Types.ObjectId, ref: "Image" },
  imageAnalysis: { type: String },
  createdAt: { type: Date, default: Date.now() },
  ratings: [{ type: Schema.Types.ObjectId, ref: "Rating" }],
  ratingAverage: { type: Number, default: 0 },
  recommendations: [{ type: Schema.Types.ObjectId, ref: "Recommendation" }],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
}).plugin(AutoIncrement, { id: "artwork_id_counter", inc_field: "id" });
// .plugin(ratingsAverage);
