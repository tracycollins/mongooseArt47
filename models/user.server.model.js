const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.UserSchema = new Schema({
  id: { type: String, unique: true, lowercase: true },
  oauthID: { type: String, unique: true },
  email: { type: String },
  userName: { type: String, lowercase: true },
  name: { type: String },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  nickname: { type: String }, // not 'nickName' cuz facebook
  network: { type: Schema.Types.ObjectId, ref: "NeuralNetwork" },
  image: { type: Schema.Types.ObjectId, ref: "Image" },
  bio: { type: String },
  birthDate: { type: Date },
  deathDate: { type: Date },
  location: { type: String },
  userUrl: { type: String },
  instagramUsername: { type: String },
  twitterUsername: { type: String },
  facebookUsername: { type: String },
  createdAt: { type: Date, default: Date.now() },
  lastSeen: { type: Date, default: Date.now() },
  rated: { type: Number },
  ratings: [{ type: Schema.Types.ObjectId, ref: "Rating" }],
  unrated: [{ type: Schema.Types.ObjectId, ref: "Artwork" }],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
});
