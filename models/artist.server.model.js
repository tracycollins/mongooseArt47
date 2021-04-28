/* eslint-disable max-depth */
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AutoIncrement = require("mongoose-sequence")(mongoose);

exports.ArtistSchema = new Schema({
  // id: { type: String, unique: true, lowercase: true },
  artistId: { type: String, unique: true, lowercase: true },
  oauthID: { type: String },
  userName: { type: String, default: "", lowercase: true },
  firstName: { type: String },
  middleName: { type: String },
  lastName: { type: String },
  displayName: { type: String },
  image: { type: Schema.Types.ObjectId, ref: "Image" },
  bio: { type: String },
  birthDate: { type: Date },
  deathDate: { type: Date },
  location: { type: String },
  artistUrl: { type: String },
  instagramUsername: { type: String },
  twitterUsername: { type: String },
  facebookUrl: { type: String },
  wikipediaUrl: { type: String },
  createdAt: { type: Date, default: Date.now() },
  lastSeen: { type: Date, default: Date.now() },
  artworks: [{ type: Schema.Types.ObjectId, ref: "Artwork" }],
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
}).plugin(AutoIncrement, { id: "artist_id_counter", inc_field: "id" });

exports.ArtistSchema.post(["find", "findOne"], function (artists) {
  const artistArray = !Array.isArray(artists) ? [artists] : artists;

  for (const artist of artistArray) {
    if (artist && !artist.displayName) {
      if (!artist.firstName && !artist.middleName && !artist.lastName) {
        artist.displayName = "UNKNOWN";
      } else {
        artist.displayName = "";

        if (artist.middleName && artist.middleName.length === 1) {
          artist.middleName = `${artist.middleName.toUpperCase()}.`;
        }

        for (const namePart of ["firstName", "middleName", "lastName"]) {
          artist.displayName =
            artist[namePart] !== undefined
              ? `${artist.displayName} ${artist[namePart]}`
              : artist.displayName;
          artist.displayName = artist.displayName.trim();
        }
      }
    }
  }
});
