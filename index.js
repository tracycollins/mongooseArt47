/* eslint-disable max-depth */

const chalk = require("chalk");
const chalkAlert = chalk.red;
const chalkError = chalk.bold.red;
const pRetry = require("p-retry");
const moment = require("moment");
const ObjectID = require("mongodb").ObjectID;
const treeify = require("object-treeify");
const objectPath = require("object-path");

const connectionString = `mongodb+srv://${process.env.MONGODB_ATLAS_USERNAME}:${process.env.MONGODB_ATLAS_PASSWORD}@cluster0.kv4my.mongodb.net/art47?retryWrites=true&w=majority`;

const defaultConfig = {
  appName: `MDB_ART47_${process.pid}`,
  art47db: connectionString,
  maxRetries: 5,
};

const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const imageModel = require("./models/image.server.model");
const mediaModel = require("./models/media.server.model");
const networkInputModel = require("./models/networkInput.server.model");
const neuralNetworkModel = require("./models/neuralNetwork.server.model");
const quotaModel = require("./models/quota.server.model");
const userModel = require("./models/user.server.model");
const artistModel = require("./models/artist.server.model");
const artworkModel = require("./models/artwork.server.model");
const ratingModel = require("./models/rating.server.model");
const recommendationModel = require("./models/recommendation.server.model");
const tagModel = require("./models/tag.server.model");

exports.jsonPrint = function (obj) {
  if (obj && obj != undefined) {
    try {
      if (new ObjectID(obj).isValid()) {
        return ObjectID(obj).toHexString();
      }
    } catch (e) {}
    return treeify(obj);
  } else {
    return "UNDEFINED";
  }
};

const jsonPrint = exports.jsonPrint;

/*
  For long running applications, it is often prudent to enable keepAlive with a number of milliseconds.
  Without it, after some period of time you may start to see "connection closed" errors for what seems like no reason.
  If so, after reading this, you may decide to enable keepAlive:
*/

const defaultOptions = {
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
  useNewUrlParser: true,
  autoIndex: false,
  poolSize: 80, // Maintain up to poolSize socket connections
  serverSelectionTimeoutMS: 60000, // Keep trying to send operations for serverSelectionTimeoutMS
  socketTimeoutMS: 600000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 600000,
  heartbeatFrequencyMS: 10000, // test socket every heartbeatFrequencyMS
  keepAlive: true,
  keepAliveInitialDelay: 60000,
  family: 4, // Use IPv4, skip trying IPv6
};

exports.connect = async (p) => {
  const params = p || {};
  const verbose = params.verbose || false;
  const config = Object.assign({}, defaultConfig, params.config);
  const appName = params.appName || config.appName;
  const mongoOptions = Object.assign({}, defaultOptions, params.options);

  mongoOptions.appName = appName;

  try {
    console.log(
      chalk.blue(
        `${appName} | >>> CREATING MONGO DB CONNECTION | APP NAME: ${appName} | MAX RETRIES: ${config.maxRetries}`
      )
    );

    if (verbose) {
      console.log({ config });
      console.log({ mongoOptions });
    }

    const disconnectHandler = () => {
      console.log(chalkAlert(appName + " | XXX MONGO DB DISCONNECTED XXX"));
    };

    const errorHandler = (err) => {
      console.log(
        chalkError(
          `${appName} | *** MONGO DB CONNECT ERROR | ${moment()} | ${err}`
        )
      );
    };

    mongoose.connection.on("disconnect", disconnectHandler);
    mongoose.connection.on("error", errorHandler);

    mongoose.connection.once("close", function () {
      console.log(chalkAlert(appName + " | XXX MONGO DB CLOSED XXX"));
      mongoose.connection.removeListener("error", errorHandler);
      mongoose.connection.removeListener("disconnect", disconnectHandler);
    });

    const mongooseConnect = async () => {
      await mongoose.connect(config.art47db, mongoOptions);
      return;
    };

    const onFailedAttempt = (err) => {
      console.log(
        chalk.red(
          `${appName} | !!! MONGO DB CONNECT FAILED | RETRIES: ${err.attemptNumber}/${config.maxRetries}`
        )
      );
    };

    const retryOptions = {
      retries: config.maxRetries,
      onFailedAttempt: onFailedAttempt,
    };

    await pRetry(mongooseConnect, retryOptions);

    exports.Image = mongoose.connection.model("Image", imageModel.ImageSchema);
    exports.Media = mongoose.connection.model("Media", mediaModel.MediaSchema);
    exports.NeuralNetwork = mongoose.connection.model(
      "NeuralNetwork",
      neuralNetworkModel.NeuralNetworkSchema
    );
    exports.NetworkInput = mongoose.connection.model(
      "NetworkInput",
      networkInputModel.NetworkInputSchema
    );
    exports.Quota = mongoose.connection.model("Quota", quotaModel.QuotaSchema);
    exports.User = mongoose.connection.model("User", userModel.UserSchema);
    exports.Artist = mongoose.connection.model(
      "Artist",
      artistModel.ArtistSchema
    );
    exports.Artwork = mongoose.connection.model(
      "Artwork",
      artworkModel.ArtworkSchema
    );
    exports.Rating = mongoose.connection.model(
      "Rating",
      ratingModel.RatingSchema
    );
    exports.Recommendation = mongoose.connection.model(
      "Recommendation",
      recommendationModel.RecommendationSchema
    );
    exports.Tag = mongoose.connection.model("Tag", tagModel.TagSchema);

    console.log(chalk.bold.green(appName + " | +++ MONGO DB CONNECTED"));
    return mongoose.connection;
  } catch (err) {
    console.log(
      chalkError(`${appName} | *** MONGO DB CONNECTION ERROR: ${err}`)
    );
    throw err;
  }
};

exports.createDefaultIndexes = async () => {
  try {
    const defaultModelIndexes = {
      artists: [
        { id: 1 },
        { artistId: 1 },
        { displayName: 1 },
        { userName: 1 },
        { name: 1 },
        { location: 1 },
        { "tags.0": 1 },
      ],
      artworks: [
        { id: 1 },
        { artist: 1 },
        { artworkId: 1 },
        { image: 1 },
        { title: 1 },
        { ratingAverage: 1 },
        { "tags.0": 1 },
      ],
      ratings: [{ id: 1 }, { artwork: 1 }, { user: 1 }],
      recommendations: [{ artwork: 1, user: 1 }],
      tags: [{ id: 1 }],
      users: [
        { id: 1 },
        { name: 1 },
        { oauthID: 1 },
        { userName: 1 },
        { location: 1 },
        { "tags.0": 1 },
      ],
    };

    for (const model of Object.keys(defaultModelIndexes)) {
      for (const indexObj of defaultModelIndexes[model]) {
        console.log(
          chalk.blue(`CREATING ${model} INDEX: ${Object.keys(indexObj)}`)
        );

        try {
          const collection = mongoose.connection.collection(model);

          if (indexObj.id !== undefined) {
            await collection.createIndex(indexObj, {
              unique: true,
              background: true,
            });
          } else {
            await collection.createIndex(indexObj, { background: true });
          }

          console.log(
            chalk.green(`+++ CREATED ${model} INDEX: ${Object.keys(indexObj)}`)
          );
        } catch (e) {
          if (e.code === 85) {
            console.log(
              chalk.yellow(
                `!!! CREATING ${model} INDEX: ${Object.keys(
                  indexObj
                )} EXISTS | SKIPPING ...`
              )
            );
          } else {
            console.log(
              chalkAlert(
                `!!! CREATING ${model} INDEX ERROR: ${Object.keys(
                  indexObj
                )} | ERR: ${e}`
              )
            );
            console.log(e);
          }
        }
      }
    }
  } catch (err) {
    console.log(chalkError(" | *** ERROR: " + err + " | QUITTING ***"));
  }
};

exports.updateArtworksRatings = async () => {
  try {
    const ratings = await global.art47db.Rating.find({}).populate("artwork");
    console.log(`${ratings.length} RATINGS`);

    for (const rating of ratings) {
      if (!rating.artwork.ratings.includes(rating._id)) {
        console.log(
          `*** rating ${rating._id} NOT FOUND IN ARTWORK: ${rating.artwork._id}`
        );
      }
    }
    return { count: ratings.length };
  } catch (err) {
    console.log(chalkError(" | *** ERROR: " + err + " | QUITTING ***"));
  }
};

exports.getDbConnection = function () {
  return mongoose.connection;
};

exports.generatePaginationQuery = function (p) {
  // paginatedQuery = user_id && ( rate/score < last_rate/score || (rate/score === last_rate/score && doc_id > lastdoc_id))

  const params = p || {};
  const query = params.query || {};
  const nextKey = params.nextKey || null;
  const sort = params.sort || null;
  const sortField = sort === null ? null : sort[0];

  // console.log({ nextKey });
  // console.log({ sort });
  // console.log({ sortField });

  function nextKeyFn(items) {
    if (items.length === 0) {
      return null;
    }

    const item = items[items.length - 1];

    if (sortField === null) {
      return { _id: ObjectID(item._id) };
    }
    if (sortField === "ratingUser.rate") {
      return {
        _id: ObjectID(item.ratingUser._id),
        "ratingUser.rate": item.ratingUser.rate,
      };
    }
    if (sortField === "recommendationUser.score") {
      return {
        _id: ObjectID(item.recommendationUser._id),
        "recommendationUser.score": item.recommendationUser.score,
      };
    }

    return { _id: ObjectID(item._id), [sortField]: item[sortField] };
  }

  if (nextKey === null) {
    return { paginatedQuery: query, nextKeyFn };
  }

  let paginatedQuery = query;

  if (sort === null) {
    paginatedQuery._id = { $gt: ObjectID(nextKey._id) };
    return { paginatedQuery: paginatedQuery, nextKeyFn };
  }

  const sortOperator = sort[1] === 1 ? "$gt" : "$lt";

  const paginationQuery = [
    { [sortField]: { [sortOperator]: nextKey[sortField] } },
    {
      $and: [
        { [sortField]: nextKey[sortField] },
        // { _id: { [sortOperator]: ObjectID(nextKey._id) } },
        { _id: { $gt: ObjectID(nextKey._id) } },
      ],
    },
  ];

  if (paginatedQuery.$or === null) {
    paginatedQuery.$or = paginationQuery;
  } else {
    paginatedQuery = { $and: [query, { $or: paginationQuery }] };
  }

  return { paginatedQuery, nextKeyFn };
};

const artworkAggregate = async (params) => {
  const verbose = params.verbose || false;
  const user_id = params.user_id || false;
  const sort = params.sort || { _id: 1 };
  const maxDocId = params.maxDocId || false;
  const minDocId = params.minDocId || false;
  const maxValue = params.maxValue || Infinity;
  const minValue = params.minValue || 0;
  const size = params.size || 20;

  let user = false;

  if (user_id) {
    user = await global.art47db.User.findOne({
      _id: user_id,
    });
    console.log(
      `artworkAggregate | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId}`
    );
  } else {
    console.log(`artworkAggregate | minDocId: ${minDocId}`);
  }

  const query = {};

  if (minDocId) {
    query["id"] = { $gt: minDocId };
  } else if (maxDocId) {
    query["id"] = { $lt: maxDocId };
  }

  const artworks = await global.art47db.Artwork.find(query)
    .sort(sort)
    .limit(size)
    .populate("ratings")
    .populate("recommendations")
    .populate("image")
    .populate("artist")
    .lean();

  console.log(`artworkAggregate | ${artworks.length} ARTWORKS FOUND`);

  if (user) {
    const artworksUser = artworks.map((artwork) => {
      artwork.ratingUser = artwork.ratings.find((rating) => {
        if (verbose) {
          if (
            ObjectID(rating.user).toHexString() ===
            ObjectID(params.user_id).toHexString()
          ) {
            console.log(
              `* HIT  | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
            );
          } else {
            console.log(
              `- MISS | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
            );
            console.log({ rating });
          }
        }
        return (
          ObjectID(rating.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        );
      });
      artwork.recommendationUser = artwork.recommendations.find((rec) => {
        if (verbose) {
          if (
            ObjectID(rec.user).toHexString() ===
            ObjectID(params.user_id).toHexString()
          ) {
            console.log(
              `* HIT  | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
            );
          } else {
            console.log(
              `- MISS | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
            );
          }
        }
        return (
          ObjectID(rec.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        );
      });
      return artwork;
    });

    console.log(
      `artworkAggregate | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId} | ${artworksUser.length} ARTWORKS FOUND`
    );

    return artworksUser;
  }
  return artworks;
};

const artworkRated = async (params) => {
  const verbose = params.verbose || false;
  const user_id = params.user_id;
  const maxDocId = params.maxDocId || Infinity;
  const minDocId = params.minDocId || 0;
  const maxValue = params.maxValue || Infinity;
  const minValue = params.minValue || 0;
  const size = params.size || 20;

  const user = await global.art47db.User.findOne({
    _id: user_id,
  });

  console.log(
    `artworkRated | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId} | maxValue: ${maxValue}`
  );

  const query = {
    $and: [
      { user: user },
      {
        $or: [
          { rate: { $lt: maxValue } },
          {
            $and: [{ rate: maxValue }, { id: { $gt: parseInt(minDocId) } }],
          },
        ],
      },
    ],
  };
  const ratings = await global.art47db.Rating.find(query)
    .sort({ rate: -1 })
    .lean();

  console.log(
    `artworkRated | USER ${user._id} | ${user.oauthID} | ${ratings.length} RATED`
  );
  if (ratings.length < size) {
    console.log(
      `artworkRated | XXX END CURSOR XXX | USER ${user._id} | ${user.oauthID}`
    );
  }

  const artworkIdArray = ratings.slice(0, size).map((rating) => rating.artwork);

  const artworks = await global.art47db.Artwork.find({
    _id: { $in: artworkIdArray },
  })
    .populate("ratings")
    .populate("recommendations")
    .populate("image")
    .populate("artist")
    .lean();

  const artworksUser = artworks.map((artwork) => {
    artwork.ratingUser = artwork.ratings.find((rating) => {
      if (verbose) {
        if (
          ObjectID(rating.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        ) {
          console.log(
            `* HIT  | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
          );
        } else {
          console.log(
            `- MISS | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
          );
          console.log({ rating });
        }
      }
      return (
        ObjectID(rating.user).toHexString() ===
        ObjectID(params.user_id).toHexString()
      );
    });
    artwork.recommendationUser = artwork.recommendations.find((rec) => {
      if (verbose) {
        if (
          ObjectID(rec.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        ) {
          console.log(
            `* HIT  | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
          );
        } else {
          console.log(
            `- MISS | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
          );
        }
      }
      return (
        ObjectID(rec.user).toHexString() ===
        ObjectID(params.user_id).toHexString()
      );
    });
    return artwork;
  });

  artworksUser.sort((a, b) => {
    if (a.ratingUser.rate < b.ratingUser.rate) return 1;
    if (a.ratingUser.rate > b.ratingUser.rate) return -1;
    if (a.ratingUser.id > b.ratingUser.id) return 1;
    if (a.ratingUser.id < b.ratingUser.id) return -1;
    return 0;
  });

  console.log(
    `artworkRated | USER ${user._id}` +
      ` | ${user.oauthID}` +
      ` | minDocId: ${minDocId}` +
      ` | maxValue: ${maxValue}` +
      ` | ${artworksUser.length} ARTWORKS FOUND`
  );

  return artworksUser;
};
//
const artworkRatingAverage = async (params) => {
  const verbose = params.verbose || false;
  const user_id = params.user_id;
  const sort = params.sort || { ratingAverage: -1 };
  console.log({ sort });
  const maxDocId = params.maxDocId;
  const minDocId = params.minDocId;
  const maxValue = params.maxValue || Infinity;
  const minValue = params.minValue || 0;
  const size = params.size || 20;

  const user = await global.art47db.User.findOne({
    _id: user_id,
  });

  console.log(
    `artworkRatingAverage | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId} | maxValue: ${maxValue}`
  );

  const query = {
    $or: [
      { ratingAverage: { $lt: maxValue } },
      {
        $and: [
          { ratingAverage: maxValue },
          { id: { $gt: parseInt(minDocId) } },
        ],
      },
    ],
  };
  const artworks = await global.art47db.Artwork.find(query)
    .sort(sort)
    .limit(size)
    .populate("ratings")
    .populate("recommendations")
    .populate("image")
    .populate("artist")
    .lean();

  console.log(
    `artworkRatingAverage | USER ${user._id} | ${user.oauthID} | ${artworks.length} ARTWORKS`
  );

  const artworksUser = artworks.map((artwork) => {
    artwork.ratingUser = artwork.ratings.find((rating) => {
      if (verbose) {
        if (
          ObjectID(rating.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        ) {
          console.log(
            `* HIT  | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
          );
        } else {
          console.log(
            `- MISS | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
          );
          console.log({ rating });
        }
      }
      return (
        ObjectID(rating.user).toHexString() ===
        ObjectID(params.user_id).toHexString()
      );
    });
    artwork.recommendationUser = artwork.recommendations.find((rec) => {
      if (verbose) {
        if (
          ObjectID(rec.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        ) {
          console.log(
            `* HIT  | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
          );
        } else {
          console.log(
            `- MISS | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
          );
        }
      }
      return (
        ObjectID(rec.user).toHexString() ===
        ObjectID(params.user_id).toHexString()
      );
    });
    return artwork;
  });

  console.log(
    `artworkRatingAverage | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId} | maxValue: ${maxValue} | ${artworksUser.length} ARTWORKS FOUND`
  );

  return artworksUser;
};

const artworkRecommended = async (params) => {
  const verbose = params.verbose || false;
  const user_id = params.user_id;
  const maxDocId = params.maxDocId || Infinity;
  const minDocId = params.minDocId || 0;
  const maxValue = params.maxValue || Infinity;
  const minValue = params.minValue || 0;
  const size = params.size || 20;

  const user = await global.art47db.User.findOne({
    _id: user_id,
  });

  console.log(
    `artworkRecommended | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId} | maxValue: ${maxValue}`
  );

  const query = {
    $and: [
      { user: user },
      {
        $or: [
          { score: { $lt: maxValue } },
          {
            $and: [{ score: maxValue }, { id: { $gt: parseInt(minDocId) } }],
          },
        ],
      },
    ],
  };
  const recommendations = await global.art47db.Recommendation.find(query)
    .sort({ score: -1 })
    .lean();

  console.log(
    `artworkRecommended | USER ${user._id} | ${user.oauthID} | ${recommendations.length} RECOMMENDED`
  );

  const idArray = recommendations
    .slice(0, size)
    .map((recommendation) => recommendation.artwork);

  const artworks = await global.art47db.Artwork.find({
    _id: { $in: idArray },
  })
    .populate("ratings")
    .populate("recommendations")
    .populate("image")
    .populate("artist")
    .lean();

  const artworksUser = artworks.map((artwork) => {
    artwork.ratingUser = artwork.ratings.find((rating) => {
      if (verbose) {
        if (
          ObjectID(rating.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        ) {
          console.log(
            `* HIT  | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
          );
        } else {
          console.log(
            `- MISS | RATING ${rating._id} USER ${rating.user} | USER_ID: ${params.user_id}`
          );
        }
      }
      return (
        ObjectID(rating.user).toHexString() ===
        ObjectID(params.user_id).toHexString()
      );
    });
    artwork.recommendationUser = artwork.recommendations.find((rec) => {
      if (verbose) {
        if (
          ObjectID(rec.user).toHexString() ===
          ObjectID(params.user_id).toHexString()
        ) {
          console.log(
            `* HIT  | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
          );
        } else {
          console.log(
            `- MISS | REC ${rec._id} USER ${rec.user} | USER_ID: ${params.user_id}`
          );
        }
      }
      return (
        ObjectID(rec.user).toHexString() ===
        ObjectID(params.user_id).toHexString()
      );
    });
    return artwork;
  });

  artworksUser.sort((a, b) => {
    if (a.recommendationUser.score < b.recommendationUser.score) return 1;
    if (a.recommendationUser.score > b.recommendationUser.score) return -1;
    if (a.recommendationUser.id > b.recommendationUser.id) return 1;
    if (a.recommendationUser.id < b.recommendationUser.id) return -1;
    return 0;
  });

  console.log(
    `artworkRecommended | USER ${user._id} | ${user.oauthID} | minDocId: ${minDocId} | maxValue: ${maxValue} | ${artworksUser.length} ARTWORKS FOUND`
  );

  return artworksUser;
};

const artworksUserTopUnratedRecs = async (params) => {
  const verbose = params.verbose || false;
  const user_id = params.user_id;
  const sort = params.sort || { score: -1 };
  const minScore = params.minScore || 1;
  const size = params.size || 20;

  const user = await global.art47db.User.findOne({
    _id: user_id,
  });

  const artworks = await global.art47db.Artwork.find({
    _id: { $in: user.unrated },
  })
    .populate("ratings")
    .populate("recommendations")
    .populate("image")
    .populate("artist")
    .lean();

  let topArtworks = [];
  for (const artwork of artworks) {
    if (
      artwork.ratings.find(
        (rating) =>
          ObjectID(rating.user).toHexString() !==
          ObjectID(user._id).toHexString()
      )
    ) {
      artwork.recommendationUser = artwork.recommendations.find(
        (rec) =>
          ObjectID(rec.user).toHexString() === ObjectID(user._id).toHexString()
      );
      topArtworks.push(artwork);
    }
  }

  resultArtworks = topArtworks
    .sort((a, b) => {
      if (a.recommendationUser.score < b.recommendationUser.score) return 1;
      if (a.recommendationUser.score > b.recommendationUser.score) return -1;
      if (a.recommendationUser.id > b.recommendationUser.id) return 1;
      if (a.recommendationUser.id < b.recommendationUser.id) return -1;
      return 0;
    })
    .slice(0, 10);

  return resultArtworks;
};

const artworkUnrated = async (params) => {
  const verbose = params.verbose || false;
  const user_id = params.user_id;
  const sort = params.sort || { _id: 1 };
  const maxDocId = params.maxDocId;
  const minDocId = params.minDocId || false;
  const maxValue = params.maxValue || Infinity;
  const minValue = params.minValue || 0;
  const size = params.size || 20;

  console.log({ sort });

  const user = await global.art47db.User.findOne({
    _id: user_id,
  });

  console.log(
    `artworkUnrated | USER ${user._id} | ${user.oauthID} | ${user.unrated.length} UNRATED`
  );

  const idArray = user.unrated.sort();

  let query = {};

  if (minDocId) {
    query = {
      $and: [{ _id: { $in: idArray } }, { id: { $gt: minDocId } }],
    };
  } else {
    query = { _id: { $in: idArray } };
  }

  const artworks = await global.art47db.Artwork.find(query)
    .populate("ratings")
    .populate("recommendations")
    .populate("image")
    .populate("artist")
    .sort(sort)
    .limit(size)
    .lean();

  return artworks;
};

const artworkUnratedAggregate = async (params) => {
  const query = params.query || null;
  const match = params.match || null;
  const size = params.size || 20;

  const user = await global.art47db.User.findOne({
    _id: params.user_id,
  });

  if (user && user.unrated && user.unrated.length > 0) {
    const ratings = await global.art47db.Rating.find({
      user: ObjectID(params.user_id),
    })
      .lean()
      .select("_id");

    console.log(
      `artworkUnratedAggregate | USER ${user._id} | ${user.oauthID} | ${ratings.length} RATED | ${user.unrated.length} UNRATED`
    );
    const idArray = user.unrated.slice(0, size).map((id) => ObjectID(id));
    const artworks = await global.art47db.Artwork.find({
      _id: { $in: idArray },
    })
      .populate("ratings")
      .populate("image")
      .populate("artist");

    return artworks;
  } else {
    const artworks = await global.art47db.Artwork.aggregate([
      {
        $lookup: {
          from: "ratings",
          localField: "ratings",
          foreignField: "_id",
          as: "ratings",
        },
      },
      {
        $unwind: {
          path: "$ratings",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "ratings.user",
          foreignField: "_id",
          as: "ratings.user",
        },
      },
      {
        $unwind: {
          path: "$ratings.user",
        },
      },
      {
        $group: {
          _id: "$_id",
          root: {
            $mergeObjects: "$$ROOT",
          },
          ratings: {
            $push: "$ratings",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          root: 0,
        },
      },
      {
        $match: { "ratings.user._id": { $ne: ObjectID(params.user_id) } },
      },
      { $project: { ratingUser: 0, url: 0, imageAnalysis: 0, __v: 0 } },
      {
        $sort: params.sort,
      },
      {
        $lookup: {
          from: "artists",
          localField: "artist",
          foreignField: "_id",
          as: "artist",
        },
      },
      {
        $unwind: {
          path: "$artist",
        },
      },
      {
        $lookup: {
          from: "images",
          localField: "image",
          foreignField: "_id",
          as: "image",
        },
      },
      {
        $unwind: {
          path: "$image",
        },
      },
      {
        $lookup: {
          from: "recommendations",
          localField: "recommendations",
          foreignField: "_id",
          as: "recommendations",
        },
      },
      {
        $unwind: {
          path: "$recommendations",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "recommendations.user",
          foreignField: "_id",
          as: "recommendations.user",
        },
      },
      {
        $unwind: {
          path: "$recommendations.user",
        },
      },
      {
        $group: {
          _id: "$_id",
          root: {
            $mergeObjects: "$$ROOT",
          },
          recommendations: {
            $push: "$recommendations",
          },
          recommendationUser: {
            $mergeObjects: "$recommendations",
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", "$$ROOT"],
          },
        },
      },
      {
        $project: {
          root: 0,
        },
      },
      {
        $lookup: {
          from: "tags",
          localField: "tags",
          foreignField: "_id",
          as: "tags",
        },
      },
      { $limit: params.limit },
    ]);

    return artworks;
  }
};

const ratingsAggregate = async (params) => {
  const ratings = await global.art47db.Rating.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
      },
    },
    {
      $match: params.match,
    },
    {
      $sort: params.sort,
    },
    {
      $limit: params.limit,
    },
    {
      $lookup: {
        from: "artworks",
        localField: "artwork",
        foreignField: "_id",
        as: "artwork",
      },
    },
    {
      $unwind: {
        path: "$artwork",
      },
    },
    {
      $lookup: {
        from: "artists",
        localField: "artwork.artist",
        foreignField: "_id",
        as: "artwork.artist",
      },
    },
    {
      $unwind: {
        path: "$artwork.artist",
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "artwork.image",
        foreignField: "_id",
        as: "artwork.image",
      },
    },
    {
      $unwind: {
        path: "$artwork.image",
      },
    },
    {
      $lookup: {
        from: "recommendations",
        localField: "artwork.recommendations",
        foreignField: "_id",
        as: "artwork.recommendations",
      },
    },
  ]);

  return ratings;
};

const recommendationsAggregate = async (params) => {
  const recs = await global.art47db.Recommendation.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
      },
    },
    {
      $match: params.match,
    },
    {
      $sort: params.sort,
    },
    {
      $limit: params.limit,
    },
    {
      $lookup: {
        from: "artworks",
        localField: "artwork",
        foreignField: "_id",
        as: "artwork",
      },
    },
    {
      $unwind: {
        path: "$artwork",
      },
    },
    {
      $lookup: {
        from: "artists",
        localField: "artwork.artist",
        foreignField: "_id",
        as: "artwork.artist",
      },
    },
    {
      $unwind: {
        path: "$artwork.artist",
      },
    },
    {
      $lookup: {
        from: "images",
        localField: "artwork.image",
        foreignField: "_id",
        as: "artwork.image",
      },
    },
    {
      $unwind: {
        path: "$artwork.image",
      },
    },
    {
      $lookup: {
        from: "ratings",
        localField: "artwork.ratings",
        foreignField: "_id",
        as: "artwork.ratings",
      },
    },
  ]);

  return recs;
};

exports.sortBySubDocUserPaginate = async function (p) {
  try {
    const params = p || {};
    const query = params.query || {};
    const cursor = params.cursor || {};
    const user_id = params.user_id || null;
    const maxDocId = params.maxDocId || Infinity;
    const minDocId = params.minDocId || 0;
    const sort = params.sort || { _id: 1 };
    const minValue = params.minValue || 0;
    const maxValue = params.maxValue || Infinity;
    const match = params.match || params.query || null;
    const subDoc = params.subDoc || "none"; // rating, recommendation, unrated
    const limit = params.limit || 10;
    const verbose = params.verbose || false;

    let artworks = [];

    switch (subDoc) {
      case "none":
        artworks = await artworkAggregate({
          user_id,
          maxDocId,
          minDocId,
          minValue,
          maxValue,
          sort,
          limit,
          verbose,
        });
        break;
      case "unrated":
        if (sort === "top") {
          artworks = await artworksUserTopUnratedRecs({
            user_id,
            // minScore: 47,
            maxDocId,
            minDocId,
            minValue,
            maxValue,
            limit,
            sort,
            verbose,
          });
          break;
        } else {
          artworks = await artworkUnrated({
            user_id,
            maxDocId,
            minDocId,
            minValue,
            maxValue,
            limit,
            sort,
            verbose,
          });
          break;
        }
      case "rating":
        artworks = await artworkRated({
          user_id,
          maxDocId,
          minDocId,
          minValue,
          maxValue,
          limit,
          verbose,
        });
        break;
      case "ratingAverage":
        artworks = await artworkRatingAverage({
          user_id,
          maxDocId,
          minDocId,
          minValue,
          maxValue,
          sort,
          limit,
          verbose,
        });
        break;
      case "recommendation":
        artworks = await artworkRecommended({
          user_id,
          maxDocId,
          minDocId,
          minValue,
          maxValue,
          limit,
          verbose,
        });

        break;
      default:
    }

    return artworks;
  } catch (err) {
    console.log(`sortBySubDocUserPaginate ERROR: ${err}`);
    throw err;
  }
};

exports.ratingByUserPaginate = async function (p) {
  try {
    const params = p || {};
    const match = params.match || params.query || null;
    const sort = params.sort || { _id: 1 };
    const limit = params.limit || 10;

    const ratings = await global.art47db.Rating.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
        },
      },
      {
        $match: match,
        // $match: {
        //   "user.oauthID": oauthID,
        // },
      },
      {
        $sort: sort,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "artworks",
          localField: "artwork",
          foreignField: "_id",
          as: "artwork",
        },
      },
      {
        $unwind: {
          path: "$artwork",
        },
      },
      {
        $lookup: {
          from: "images",
          localField: "artwork.image",
          foreignField: "_id",
          as: "artwork.image",
        },
      },
      {
        $unwind: {
          path: "$artwork.image",
        },
      },
      {
        $lookup: {
          from: "recommendations",
          localField: "artwork.recommendations",
          foreignField: "_id",
          as: "artwork.recommendations",
        },
      },
    ]);

    return ratings;
  } catch (err) {
    console.log(`ratingByUserPaginate ERROR: ${err}`);
    throw err;
  }
};
