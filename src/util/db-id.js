const ObjectId = require('mongoose').Types.ObjectId;


class DbId {
  constructor(id_string) {
    this.id_string = id_string;
  }

  isValid() {
    try {
      new ObjectId(this.id_string);
    } catch (error) {
      return false;
    }
    return true;
  }

  get asObjectId() {
    return new ObjectId(this.id_string);
  }
}

exports.DbId = DbId;
