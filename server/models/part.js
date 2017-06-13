'use strict';

const Joi = require('joi');
const MongoModels = require('mongo-models');
const Sequence = require('./sequence');

class Part extends MongoModels {

  static create(name, description, userId, displayId, bioDesignId, callback) {

    const document = {
      name: name,
      description: description,
      userId: userId,
      displayId: displayId,
      bioDesignId: bioDesignId
    };

    this.insertOne(document, (err, docs) => {

      if (err) {
        return callback(err);
      }
      callback(null, docs[0]);
    });
  }

  // allows for input ids to be a list or just a single id
  static findBySequenceId(seqId, callback) {

    var query;
    if (seqId.constructor === Array) {
      query = {'sequenceId': {$in: seqId}};
    } else {
      query = {'sequenceId': seqId};
    }

    this.find(query, (err, parts) => {

      if (err) {
        return callback(err);
      }

      return callback(err, parts);

    });
  }

  static findByBioDesignId(bioDesignId, callback) {

    const query = {bioDesignId: bioDesignId};
    this.find(query, (err, parts) => {

      if (err) {
        return callback(err);
      }

      this.getSequence(0, parts, callback);
    });
  }

  //most likely one sequence only, may have to review this function
  static getSequence(index, parts, callback) {

    if (index == parts.length) {
      return callback(null, parts);
    }

    Sequence.findByPartId(parts[index]['_id'].toString(), (err, sequences) => {

      if (err) {
        return callback(err, null);
      }

      if (sequences.length != 0) {
        parts[index].sequences = sequences;
      }

      return this.getSequence(index + 1, parts, callback);
    });
  }


}

// Original Java
//
// /**
//  * Change the Format of the Part
//  * @param format new Format for the Part
//  */
// public void setFormat(Format format) {
//   if (format.checkPart(this)) {
//     this.format = format;
//   }
// }
//
// public List<FeatureRole> getRoles() {
//   List<FeatureRole> roles = new LinkedList<FeatureRole>();
//   for (Annotation annotation : sequence.getAnnotations()) {
//     Feature feature = annotation.getFeature();
//     if (feature != null) {
//       roles.add(feature.getRole());
//     }
//   }
//   return roles;
// }
//
// public Assembly createAssembly() {
//   if (assemblies == null) {
//     assemblies = new ArrayList<Assembly>();
//   }
//   Assembly assembly = new Assembly();
//   assemblies.add(assembly);
//   return assembly;
// }
//
// public void addAssembly(Assembly assembly) {
//   if (assemblies == null) {
//     assemblies = new ArrayList<Assembly>();
//   }
//   assemblies.add(assembly);
// }


Part.collection = 'parts';

Part.schema = Joi.object().keys({
  _id: Joi.object(),
  name: Joi.string().required(),
  description: Joi.string(),
  userId: Joi.string().required(),
  displayId: Joi.string().optional(),
  bioDesignId: Joi.string(),
  sequenceId: Joi.string()
});

Part.indexes = [
  {key: {userId: 1}}
];

module.exports = Part;
