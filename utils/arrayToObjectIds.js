var mongoose = require("mongoose");

const arrayToObjectIds = (arr) => {
  let array = arr.map((item) =>
    mongoose.Types.ObjectId(item.replace('"', " "))
  );
  return array;
};

module.exports = arrayToObjectIds;
