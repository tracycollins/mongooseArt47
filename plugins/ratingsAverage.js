module.exports = exports = function artworkRatingsAveragePlugin(schema) {
  schema.post(
    [
      "find",
      "findOne",
      "findOneAndUpdate",
      "update",
      "updateOne",
      "updateMany",
    ],
    function (artworkDocs) {
      if (!Array.isArray(artworkDocs)) {
        // eslint-disable-next-line no-param-reassign
        artworkDocs = [artworkDocs];
      }
      for (const artworkDoc of artworkDocs) {
        if (artworkDoc && artworkDoc.ratings && artworkDoc.ratings.length > 0) {
          let sum = 0;
          for (const rating of artworkDoc.ratings) {
            sum += rating.rate && rating.rate > 0 ? rating.rate : 0;
          }
          artworkDoc.ratingAverage = sum / artworkDoc.ratings.length;
          console.log(
            `artworkRatingsAveragePlugin: ARTWORK: ${artworkDoc.id} | ${artworkDoc.ratings.length} RATINGS | AVE: ${artworkDoc.ratingAverage}`
          );
        }
      }
    }
  );
};
