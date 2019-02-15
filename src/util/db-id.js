const ObjectId = require('mongoose').Types.ObjectId;


class DbId {
  constructor(id_string) {
    this.id_string = id_string;
    try {
      this._objectId = new ObjectId(this.id_string);
    } catch (error) {
      this._objectId = null;
    }
  }

  isValid() {
    return (this._objectId instanceof ObjectId);
  }

  get asObjectId() {
    return this._objectId;
  }
}

exports.DbId = DbId;
