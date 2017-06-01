'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Influence = require('./influence');

class Module extends MongoModels {

  static create(name, description, role, userId, callback) {

    const document = {
      name: name,
      description: description,
      role: role,
      userId: userId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }
}

//
// public void addInfluence(Influence influence) {
//   if (influences == null) {
//     influences = new HashSet<Influence>();
//   }
//   influences.add(influence);
// }



Module.collection = 'modules';

Module.schema = Joi.object().keys({
  _id: Joi.object(),
  role: Joi.string().valid('TRANSCRIPTION', 'TRANSLATION', 'EXPRESSION', 'COMPARTMENTALIZATION', 'LOCALIZATION', 'SENSOR', 'REPORTER', 'ACTIVATION', 'REPRESSION').required(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  influences: Influence.schema,
  parentModule: Joi.string()
});

Module.indexes = [
  {key: {userId: 1}}
];

module.exports = Module;
