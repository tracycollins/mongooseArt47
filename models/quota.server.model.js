/* eslint-disable no-invalid-this */
const mongoose = require("mongoose");
const moment = require("moment");
const Schema = mongoose.Schema;

exports.QuotaSchema = new Schema({
	quotaId: { type: String, unique: true }, 
	quotaDuration: { type: String }, // minute, second, hour, day, etc
	quotaStart: { type: Date, default: Date.now() },
	quotaEnd: { type: Date, default: Date.now() },
	quotaCount: { type: Number, default: 1 }, // requests/quotaPeriod
	quotaExhausted: { type: Boolean, default: false }, // requests/quotaPeriod
	createdAt: { type: Date, default: Date.now() },
	lastSeen: { type: Date, default: Date.now() },
	requestCount: { type: Number, default: 0 }
});

exports.QuotaSchema.pre("save", function(next) {

	this.lastSeen = new Date(moment().toISOString());

	if (this.requestCount >= this.quotaCount){
		this.quotaExhausted = true;
	}
	else{
		this.quotaExhausted = false;
	}
  next();
});

exports.QuotaSchema.post("save", function(next) {

	this.lastSeen = new Date(moment().toISOString());

	if (this.requestCount >= this.quotaCount){
		this.quotaExhausted = true;
	}
	else{
		this.quotaExhausted = false;
	}
});

exports.QuotaSchema.post(["find", "findOne"], function(quotas) {

  if (!Array.isArray(quotas)) {
    quotas = [quotas];
  }
  for (const quota of quotas) {
    if (quota && quota !== undefined){

			quota.lastSeen = new Date(moment().toISOString());

			if (quota.requestCount >= quota.quotaCount){
				quota.quotaExhausted = true;
			}
			else{
				quota.quotaExhausted = false;
			}
    }
  }

});
