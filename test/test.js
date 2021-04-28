/* eslint-disable no-undef */
const should = require("should");
var chai = require("chai");
var expect = chai.expect;
const chalk = require("chalk");
const _ = require("lodash");
const ObjectID = require("mongodb").ObjectID;

global.art47db = require("../index.js");

const jsonPrint = global.art47db.jsonPrint;

async function connectDb() {
  try {
    console.log("CONNECT MONGO DB ...");

    const appName = "TEST_" + process.pid;
    // const dbName = "test";
    const dbName = "art47";
    const connectionString = `mongodb+srv://${process.env.MONGODB_ATLAS_USERNAME}:${process.env.MONGODB_ATLAS_PASSWORD}@cluster0.kv4my.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    // const badConnectionString = `mongodb+srv://${process.env.MONGODB_ATLAS_USERNAME}:badPassWord@cluster0.kv4my.mongodb.net/${dbName}?retryWrites=true&w=majority`;

    const db = await global.art47db.connect({
      appName: appName,
      config: {
        // art47db: badConnectionString
        art47db: connectionString,
      },
      options: {
        serverSelectionTimeoutMS: 12347,
      },
    });

    console.log(`MONGOOSE DEFAULT CONNECTION OPEN | DB NAME: ${dbName}`);

    // await global.art47db.createDefaultIndexes();

    return db;
  } catch (err) {
    console.log("*** MONGO DB CONNECT ERROR: " + err);
    console.trace(err);
    throw err;
  }
}

const test_artworksUnratedPaginate = ({ user_id }) =>
  it("artworksUnratedPaginate", async function () {
    this.timeout(30000);

    let artworks = [];
    let minDocId;
    let maxDocId;
    let maxValue = Infinity;
    let minValue = 0;
    let prevArtworkId = false;

    const limit = 11;

    let sortByOptions = {
      user_id,
      subDoc: "unrated",
      limit,
    };

    function verifyResults({ artworks, user_id, prevArtworkId }) {
      for (const artwork of artworks) {
        // console.log(`artwork.ratingUser: `, artwork.ratingUser);
        should.equal(artwork.ratingUser, undefined);
        if (prevArtworkId) {
          artwork.id.should.be.above(prevArtworkId);
        }

        prevArtworkId = artwork.id;
        console.log(
          `artworksUnratedPaginate | ARTWORK | ${artwork._id}` +
            ` | ID: ${artwork.id}` +
            ` | USER _ID: ${user_id}` +
            ` | RATINGS: ${artwork.ratings.length}` +
            ` | RATING USER: ${
              artwork.ratingUser ? artwork.ratingUser._id : null
            }` +
            ` | RECS: ${artwork.recommendations.length}` +
            ` | REC USER: ${
              artwork.recommendationUser ? artwork.recommendationUser._id : null
            }` +
            ` | ARTIST: ${artwork.artist.displayName}`
        );
        for (const rating of artwork.ratings) {
          // console.log(
          //   `--- RATING | ID: ${rating.id}` +
          //     ` | _ID: ${rating._id}` +
          //     ` | USER _ID: ${rating.user._id}` +
          //     ` | RATE:  ${rating.rate}`
          // );
          should.notEqual(rating.user._id.toString(), user_id);
        }
      }
    }

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults({ artworks, user_id });

    minDocId = artworks[artworks.length - 1].id;

    sortByOptions.minDocId = minDocId;

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults({ artworks, user_id });
  });
//
const test_getUserTopUnratedRecArtworks = ({ user_id }) =>
  it("getUserTopUnratedRecArtworks", async function () {
    this.timeout(30000);

    let artworks = [];
    let minDocId;
    let maxDocId;
    let maxValue = Infinity;
    let minValue = 0;
    let prevScore = false;
    let sort = "top";

    const limit = 11;

    let sortByOptions = {
      user_id,
      subDoc: "unrated",
      sort,
    };

    function verifyResults({ artworks, user_id, prevScore }) {
      for (const artwork of artworks) {
        // console.log(`artwork.recommendationUser: `, artwork.recommendationUser);
        should.equal(
          ObjectID(artwork.recommendationUser.user._id).toHexString(),
          user_id
        );
        if (prevScore) {
          artwork.recommendationUser.score.should.be.belowOrEqual(prevScore);
        }

        prevScore = artwork.recommendationUser.score;
        console.log(
          `artworksUnratedPaginate | ARTWORK | ${artwork._id}` +
            ` | ID: ${artwork.id}` +
            ` | USER _ID: ${user_id}` +
            ` | RATINGS: ${artwork.ratings.length}` +
            ` | RATING USER: ${
              artwork.ratingUser ? artwork.ratingUser._id : null
            }` +
            ` | RECS: ${artwork.recommendations.length}` +
            ` | REC USER: ${artwork.recommendationUser._id}` +
            ` | USER_ID: ${artwork.recommendationUser.user._id}` +
            ` | SCORE: ${artwork.recommendationUser.score}` +
            ` | ARTIST: ${artwork.artist.displayName}`
        );
        for (const rating of artwork.ratings) {
          should.notEqual(rating.user._id.toString(), user_id);
        }
      }
    }

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults({ artworks, user_id });
  });
//
const test_artworksPaginate = (p) =>
  it("artworksPaginate", async function () {
    //
    const params = p || {};
    const user_id = params.user_id || false;

    this.timeout(30000);

    let artworks = [];
    let minDocId;
    let maxDocId;
    let maxValue = 999;
    let minValue = 0;

    function verifyResults(artworks, userid) {
      for (const artwork of artworks) {
        const ratingUser = artwork.ratingUser || "none";
        const recUser = artwork.recommendationUser || "none";
        if (userid && ratingUser) {
          should.equal(ratingUser.user, userid);
        }
        if (userid && recUser) {
          should.equal(recUser.user, userid);
        }
        console.log(
          `ARTWORK _ID: ${artwork._id} | userid: ${userid} | RATING USER: ${ratingUser.user} | REC USER: ${recUser.user}`
        );
      }
    }

    const sort = { id: 1 };
    const limit = 11;

    let sortByOptions = {
      user_id: user_id,
      subDoc: "none",
      limit: limit,
      sort,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults(artworks, user_id);

    minDocId = artworks[artworks.length - 1].id;
    maxDocId = artworks[0].id;

    sortByOptions = {
      user_id: user_id,
      subDoc: "none",
      limit: limit,
      sort,
      minDocId: minDocId,
      maxDocId: maxDocId,
      minValue: minValue,
      maxValue: maxValue,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);
    verifyResults(artworks, user_id);
    return;
  });
//
const test_artworksSortRatingAveragePaginate = ({ user_id }) =>
  it("artworksSortRatingAveragePaginate", async function () {
    //
    this.timeout(30000);

    let artworks = [];
    let minDocId;
    let maxDocId;
    let maxValue = Infinity;
    let minValue = 0;
    let prevAve = false;
    let prevArtworkId = false;
    const sort = { ratingAverage: -1 };
    const limit = 11;

    let sortByOptions = {
      user_id: user_id,
      subDoc: "ratingAverage",
      limit: limit,
      sort,
    };

    function verifyResults(artworks, userid, prevArtworkId, prevAve) {
      for (const artwork of artworks) {
        if (prevArtworkId && prevRate === artwork.ratingUser.rate) {
          expect(parseInt(artwork.id)).to.be.at.least(prevArtworkId);
        }
        if (prevAve) {
          expect(artwork.ratingAverage).to.be.at.most(prevAve);
        }
        prevAve = artwork.ratingAverage;
        console.log(
          `RATING AVE` +
            ` | ARTWORK _ID: ${artwork._id}` +
            ` | AVE: ${artwork.ratingAverage}`
        );
      }
    }

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults(artworks, user_id, prevArtworkId, prevAve);

    minDocId = artworks[artworks.length - 1].id;
    maxValue = artworks[artworks.length - 1].ratingAverage;

    sortByOptions = {
      user_id,
      subDoc: "ratingAverage",
      limit,
      sort,
      minDocId,
      maxDocId,
      minValue,
      maxValue,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);
    verifyResults(artworks, user_id, prevArtworkId, prevAve);
    return;
  });
//
const test_artworksSortRecByUserPaginate = ({ user_id }) =>
  it("artworksSortRecByUserPaginate", async function () {
    //
    this.timeout(30000);

    let artworks = [];
    let minDocId;
    let maxDocId;
    let maxValue = Infinity;
    let minValue = 0;
    let prevScore = false;
    let prevRecId = false;

    function verifyResults(artworks, userid, prevRecId, prevScore) {
      for (const artwork of artworks) {
        if (prevRecId && prevRate === artwork.ratingUser.rate) {
          expect(parseInt(artwork.recommendationUser.id)).to.be.at.least(
            prevRecId
          );
        }
        if (prevScore) {
          expect(artwork.recommendationUser.score).to.be.at.most(prevScore);
        }
        prevRatingId = parseInt(artwork.recommendationUser.id);
        prevScore = artwork.recommendationUser.score;
        should.equal(artwork.recommendationUser.user._id.toString(), userid);
        console.log(
          `REC | ${artwork.recommendationUser._id}` +
            `REC ID | ${artwork.recommendationUser.id}` +
            ` | SCORE: ${artwork.recommendationUser.score}` +
            ` | USER _ID: ${artwork.recommendationUser.user._id}` +
            ` | ARTWORK _ID: ${artwork.recommendationUser.artwork._id}`
        );
      }
    }

    const sort = { "recommendationUser.score": -1 };
    const limit = 11;

    let sortByOptions = {
      user_id: user_id,
      subDoc: "recommendation",
      limit: limit,
      sort,
      minDocId: null,
      maxDocId: null,
      minValue: 0,
      maxValue: Infinity,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults(artworks, user_id, prevRecId, prevScore);

    minDocId = artworks[artworks.length - 1].recommendationUser.id;
    maxDocId = artworks[0].recommendationUser.id;
    maxValue = artworks[artworks.length - 1].recommendationUser.score;
    prevScore = maxValue;

    sortByOptions = {
      user_id: user_id,
      subDoc: "recommendation",
      limit: limit,
      sort,
      minDocId: minDocId,
      maxDocId: maxDocId,
      minValue: minValue,
      maxValue: maxValue,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults(artworks, user_id, prevRecId, prevScore);
    return;
  });
//
const test_artworksSortRatingsByUserPaginate = ({ user_id }) =>
  it("artworksSortRatingsByUserPaginate", async function () {
    //
    this.timeout(30000);

    let artworks = [];
    let minDocId;
    let maxDocId;
    let maxValue = Infinity;
    let minValue = 0;
    let prevRate = false;
    let prevRatingId = false;

    function verifyResults(artworks, userid, prevRatingId, prevRate) {
      for (const artwork of artworks) {
        if (prevRatingId && prevRate === artwork.ratingUser.rate) {
          expect(parseInt(artwork.ratingUser.id)).to.be.at.least(prevRatingId);
        }
        if (prevRate) {
          expect(artwork.ratingUser.rate).to.be.at.most(prevRate);
        }
        prevRate = artwork.ratingUser.rate;
        prevRatingId = parseInt(artwork.ratingUser.id);
        should.equal(artwork.ratingUser.user._id.toString(), userid);
        // console.log(artwork.ratingUser.artwork);
        console.log(
          `RATING | ${artwork.ratingUser._id}` +
            ` | RATING ID: ${artwork.ratingUser.id}` +
            ` | RATE: ${artwork.ratingUser.rate}` +
            ` | USER _ID: ${artwork.ratingUser.user._id}` +
            ` | ARTWORK ID: ${artwork.id}` +
            ` | ARTWORK _ID: ${artwork._id}`
        );
      }
    }

    const sort = { "ratingUser.rate": -1 };
    const limit = 11;

    let sortByOptions = {
      user_id: user_id,
      subDoc: "rating",
      limit: limit,
      sort,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);

    verifyResults(artworks, user_id, prevRatingId, prevRate);

    minDocId = artworks[artworks.length - 1].ratingUser.id;
    maxDocId = artworks[0].ratingUser.id;
    maxValue = artworks[artworks.length - 1].ratingUser.rate;
    prevArtworkId = minDocId;
    prevRate = maxValue;

    sortByOptions = {
      user_id: user_id,
      subDoc: "rating",
      limit: limit,
      sort,
      minDocId: minDocId,
      maxDocId: maxDocId,
      minValue: minValue,
      maxValue: maxValue,
    };

    artworks = await global.art47db.sortBySubDocUserPaginate(sortByOptions);
    verifyResults(artworks, user_id, prevArtworkId, prevRate);
  });
//
const test_updateArtworksRatings = ({ user_id }) => {
  it("updateArtworksRatings", async function () {
    this.timeout(30000);
    const results = await global.art47db.updateArtworksRatings();
    console.log({ results });
  });
};

describe("mongoose", function () {
  before(async function () {
    try {
      this.timeout(30000);

      global.dbConnection = await connectDb();
      // const session = await global.dbConnection.startSession();
      const stats = await global.dbConnection.db.stats();
      console.log("MONGO DB STATS\n", stats);
      return;
    } catch (err) {
      console.log("DB ERROR: " + err);
      throw err;
    }
  });

  after(async function () {
    if (global.dbConnection !== undefined) {
      global.dbConnection.close();
    }
    return;
  });

  describe("test generatePaginationQuery", function () {
    // const user_id = "60483532b8c09b0015454be7";
    const user_id = "6045d4035a7c0e272096c89d";
    test_artworksPaginate();
    test_artworksPaginate({ user_id });
    test_updateArtworksRatings({ user_id });
    test_artworksSortRatingAveragePaginate({ user_id });
    test_artworksSortRatingsByUserPaginate({ user_id });
    test_artworksSortRecByUserPaginate({ user_id });
    test_artworksUnratedPaginate({ user_id });
    test_getUserTopUnratedRecArtworks({ user_id });
  });
});
