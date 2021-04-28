const mongoose = require("mongoose");
const Schema = mongoose.Schema;

exports.Oauth2credentialSchema = new Schema({
	credentialType: { type: String },
	clientId: { type: String, unique: true },
	clientSecret: { type: String, trim: true },
	emailAddress: { type: String, trim: true },
	tokenType: { type: String, trim: true },
	accessToken: { type: String, trim: true },
	refreshToken: { type: String, trim: true },
	expiryDate: { type: Date },
	mentions: { type: Number, default: 0 },
	lastSeen: { type: Date.now() }
});
