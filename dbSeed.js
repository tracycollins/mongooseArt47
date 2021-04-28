/* eslint-disable no-undef */
const fs = require("fs-extra");
const jsonfile = require("jsonfile");
const _ = require("lodash");
const path = require("path");
const walker = require("walker");
const faker = require("faker");
global.art47Db = require("./index.js");

// const S3 = require("@aws-sdk/client-s3");
// const s3Client = new S3.S3Client({ region: "us-east-1"});

// const s3PutObject = async function(params){
//   const s3PutObject = new S3.PutObjectCommand(params)
//   const results = await s3Client.send(s3PutObject);
//   return results;
// };

// const s3GetObject = async function(params){
//   const s3GetObject = new S3.GetObjectCommand(params)
//   const results = await s3Client.send(s3GetObject);
//   return results;
// };

const DEFAULT_ARTISTS_FOLDER = "/Users/tc/Dropbox/Apps/art47/artwork/artists";

async function connectDb() {
  try {
    console.log("CONNECT MONGO DB ...");

    const appName = "DB_SEED_" + process.pid;
    const dbName = "art47";
    const connectionString = `mongodb+srv://${process.env.MONGODB_ATLAS_USERNAME}:${process.env.MONGODB_ATLAS_PASSWORD}@cluster0.kv4my.mongodb.net/${dbName}?retryWrites=true&w=majority`;

    const db = await global.art47db.connect({
      appName: appName,
      config: {
        art47db: connectionString,
      },
      options: {
        serverSelectionTimeoutMS: 12347,
      },
    });

    console.log(
      `DB SEED | MONGOOSE DEFAULT CONNECTION OPEN | DB NAME: ${dbName}`
    );

    // await global.art47db.createDefaultIndexes();

    // const listBuckets = new S3.ListBucketsCommand({});
    // const results = await s3Client.send(listBuckets);
    // console.log(`DB | SEED | AWS | BUCKETS`)
    // console.log(results.Buckets)

    // const s3PutObjectResults = await s3PutObject({
    //   Bucket: "art47-networks",
    //   Key: `threecee/${testNetworkObj.id}.json`,
    //   Body: networkJson
    // })

    // const s3PutObject = new S3.PutObjectCommand(params)
    // const results = await s3Client.send(s3PutObject);

    return db;
  } catch (err) {
    console.log("*** MONGO DB CONNECT ERROR: " + err);
    throw err;
  }
}

const modelsArray = [
  "Artwork",
  "Artist",
  "User",
  "Tag",
  "Rating",
  "Recommendation",
];

const dbStats = async () => {
  const stats = {};

  for (const Model of modelsArray) {
    stats[Model] = {};
    stats[Model].total = await global.art47db[Model].countDocuments();
  }
  return stats;
};

const getRandomDoc = async (params) => {
  const docs = await global.art47db[params.model].find({}).select("id").lean();
  const randomDoc = await global.art47db[params.model].findOne({
    id: _.sample(docs).id,
  });
  return randomDoc;
};

const fakeImage = async () => {
  const image = new global.art47db.Image({
    title: faker.lorem.sentence(),
    description: faker.lorem.sentences(),
    url: faker.random.image(),
  });
  const newImage = await image.save();
  return newImage;
};

const fakeDoc = async (params) => {
  const model = params.model;
  let modelObj;
  let dbDoc;

  try {
    switch (model) {
      case "Artist":
        modelObj = {
          id: "artist_" + Date.now(),
          userName: faker.internet.userName(),
          url: faker.internet.url(),
          firstName: faker.name.firstName(),
          middleName: faker.name.middleName(),
          lastName: faker.name.lastName(),
          bio: faker.lorem.sentences(),
          location: faker.address.city(),
          birthDate: faker.date.past(),
          deathDate: faker.date.recent(),
        };
        modelObj.image = await fakeImage();
        break;

      case "User":
        modelObj = {
          id: "user_" + Date.now(),
          userName: faker.internet.userName(),
          url: faker.internet.url(),
          firstName: faker.name.firstName(),
          middleName: faker.name.middleName(),
          lastName: faker.name.lastName(),
          bio: faker.lorem.sentences(),
          location: faker.address.city(),
          birthDate: faker.date.past(),
        };
        modelObj.image = await fakeImage();
        break;

      case "Artwork":
        modelObj = {
          id: "artwork_" + Date.now(),
          title: faker.random.words(),
          description: faker.lorem.paragraph(),
          medium: faker.music.genre(),
        };
        modelObj.artist = await getRandomDoc({ model: "Artist" });
        modelObj.image = await fakeImage();

        break;

      case "Rating":
        modelObj = {
          id: "rating_" + Date.now(),
          rate: Math.random(),
        };

        modelObj.user = await getRandomDoc({ model: "User" });
        modelObj.artwork = await getRandomDoc({ model: "Artwork" });
        break;

      case "Recommendation":
        modelObj = {
          id: "recommendation_" + Date.now(),
          score: Math.random(),
        };

        modelObj.user = await getRandomDoc({ model: "User" });
        modelObj.artwork = await getRandomDoc({ model: "Artwork" });
        break;

      case "Tag":
        modelObj = {
          id: faker.random.word().toLowerCase(),
        };
        break;

      default:
        break;
    }

    dbDoc = await global.art47db[model].findOne({ id: modelObj.id }).lean();

    const results = {};

    if (dbDoc) {
      console.log(`-*- DB | ${params.index} | HIT | ${model}: ${dbDoc.id}`);
      results.hit = true;
    } else {
      dbDoc = new global.art47db[model](modelObj);
      await dbDoc.save();
      console.log(`+++ DB | ${params.index} | NEW | ${model}: ${dbDoc.id}`);
      // console.log({dbDoc});
      results.new = true;
    }

    return results;
  } catch (err) {
    console.error(`*** DB | ${params.index} | ${model} ERROR: ${err}`);
    throw err;
  }
};

const createDocs = async (params) => {
  try {
    const results = {};
    results[params.model] = {};
    results[params.model].hits = 0;
    results[params.model].new = 0;
    results[params.model].total = 0;

    console.log(
      `DB SEED | createDocs | START | MODEL: ${params.model}  | FAKE: ${params.fake} | NUM: ${params.number}`
    );

    for (let index = 0; index < params.number; index++) {
      params.index = index;
      const modelResults = await fakeDoc(params);
      results[params.model].hits = modelResults.hit
        ? results[params.model].hits + 1
        : results[params.model].hits;
      results[params.model].new = modelResults.new
        ? results[params.model].new + 1
        : results[params.model].new;
      results[params.model].total =
        results[params.model].hits + results[params.model].new;
    }

    return results;
  } catch (err) {
    console.error("*** DB SEED | seedDb | ERROR: " + err);
    throw err;
  }
};

const artistRegex = /artwork\/artists\/(.+?)\//;
const artistNameReplaceRegex = /\W/g;

const generateArtistId = (artistObj) => {
  if (
    artistObj.instagram_username !== undefined &&
    artistObj.instagram_username.startsWith("@")
  ) {
    return artistObj.instagram_username.toLowerCase();
  }

  if (
    artistObj.twitter_username !== undefined &&
    artistObj.twitter_username.startsWith("@")
  ) {
    return artistObj.twitter_username.toLowerCase();
  }

  if (artistObj.name !== undefined) {
    console.log(artistObj.name);
    return artistObj.name
      .trim()
      .toLowerCase()
      .replace(artistNameReplaceRegex, "");
  }
};

const findOneAndUpdateOptions = {
  new: true,
  upsert: true,
};

const walk = function (params) {
  return new Promise(function (resolve, reject) {
    let results = {};

    walker(params.folder)
      // .filterDir(function(dir, stat) {
      // 	if (dir === '/etc/pam.d') {
      // 		console.warn('Skipping /etc/pam.d and children')
      // 		return false
      // 	}
      // 	return true
      // })
      .on("entry", function (entry, stat) {
        // console.log('Got entry: ' + entry)
      })
      .on("dir", function (dir, stat) {
        // console.log('Got directory: ' + dir)
        // console.log({stat})
      })
      .on("file", async function (file, stat) {
        const artistMatchArray = artistRegex.exec(file);
        const artist =
          artistMatchArray && artistMatchArray[1] ? artistMatchArray[1] : false;

        if (artist && path.parse(file).base === `${artist}.json`) {
          // const data = await fs.readFile(file, "utf8"); // using fs-extra
          // const artistInfoObj = parseJson(data);

          const artistInfoObj = await jsonfile.readFile(file);

          console.log(`ARTIST INFO JSON: ${path.parse(file).base}`);

          const artistId = generateArtistId(artistInfoObj);

          const artistObj = {
            id: artistId,
            oauthID: artistInfoObj.oauthID,
            displayName: artistInfoObj.name,
            instagramUsername: artistInfoObj.instagram_username,
            twitterUsername: artistInfoObj.twitter_username,
            facebookUrl: artistInfoObj.facebook_url,
            artistUrl: artistInfoObj.artist_url,
            wikipediaUrl: artistInfoObj.wikipedia_url,
            bio: artistInfoObj.bio,
            location: faker.address.city(),
            birthDate: artistInfoObj.birthdate,
            deathDate: artistInfoObj.deathdate,
          };
          console.log({ artistObj });

          const artistDoc = await global.art47db.Artist.findOneAndUpdate(
            { id: artistId },
            artistObj,
            findOneAndUpdateOptions
          );

          // const artistImageFile = "http://localhost/artwork/images/artists" + path.join("/", artist, path.parse(file).dir, "artist_image.jpg")
          // console.log({artistImageFile})
          // fs.readFileSync("cat.png")

          const image = new global.art47db.Image({
            title: artistInfoObj.name,
            url: artistImageFile,
          });

          artistDoc.image = await image.save();
          await artistDoc.save();

          console.log(`+++ ARTIST | NAME: ${artistDoc.displayName}`);
        }

        // console.log(`FILE | DIR: ${path.parse(file).dir} | ARTIST: ${artist ? artist : false} | BASE: ${path.parse(file).base}`)
        // console.log(path.basename(path.dirname(file)))
        // console.log('Got file: ' + file)
      })
      .on("symlink", function (symlink, stat) {
        console.log("Got symlink: " + symlink);
      })
      .on("blockDevice", function (blockDevice, stat) {
        console.log("Got blockDevice: " + blockDevice);
      })
      .on("fifo", function (fifo, stat) {
        console.log("Got fifo: " + fifo);
      })
      .on("socket", function (socket, stat) {
        console.log("Got socket: " + socket);
      })
      .on("characterDevice", function (characterDevice, stat) {
        console.log("Got characterDevice: " + characterDevice);
      })
      .on("error", function (er, entry, stat) {
        console.log("Got error " + er + " on entry " + entry);
      })
      .on("end", function () {
        console.log("All files traversed.");
        resolve(results);
      });
  });
};

const loadArtists = async (params) => {
  try {
    console.log(
      `DB SEED | loadArtists | START | FOLDER: ${params.folder} | NUM: ${params.maxArtworks}`
    );

    const maxArtworks = params.maxArtworks || Infinity;

    const results = await walk({ folder: params.folder });

    return results;
  } catch (err) {
    console.error("*** DB SEED | seedDb | ERROR: " + err);
    throw err;
  }
};

const seedDb = async (params) => {
  try {
    console.log(`DB SEED | seedDb | START | FAKE: ${params.fake}`);

    let results = {};

    if (params.fake) {
      results.Tag = await createDocs({
        model: "Tag",
        number: 47,
        fake: params.fake,
      });
      results.User = await createDocs({
        model: "User",
        number: 67,
        fake: params.fake,
      });
      results.Artist = await createDocs({
        model: "Artist",
        number: 37,
        fake: params.fake,
      });
      results.Artwork = await createDocs({
        model: "Artwork",
        number: 57,
        fake: params.fake,
      });
      results.Rating = await createDocs({
        model: "Rating",
        number: 77,
        fake: params.fake,
      });
      results.Recommendation = await createDocs({
        model: "Recommendation",
        number: 87,
        fake: params.fake,
      });

      console.log(results);
    } else {
      results = await loadArtists({
        folder: DEFAULT_ARTISTS_FOLDER,
      });
    }

    const stats = await dbStats();
    return stats;
  } catch (err) {
    console.error("*** DB SEED | seedDb | ERROR: " + err);
    throw err;
  }
};

const main = async () => {
  try {
    global.dbConnection = await connectDb();
    const stats = await global.dbConnection.db.stats();
    console.log("DB SEED | MONGO DB STATS\n", stats);

    const results = await seedDb({ fake: false });

    return results;
  } catch (err) {
    console.error("*** DB SEED | ERROR: " + err);
    throw err;
  }
};

main()
  .then((results) => {
    console.log(`MAIN END`);
    console.log({ results });
    setTimeout(() => {
      if (global.dbConnection !== undefined) {
        global.dbConnection.close();
      }
    }, 5000);
  })
  .catch((err) => {
    if (global.dbConnection !== undefined) {
      global.dbConnection.close();
    }
    console.error(err);
  });
