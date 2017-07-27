'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const ObjectID = require('mongo-models').ObjectID;

const internals = {};

internals.applyRoutes = function (server, next) {

  const Device = server.plugins['hapi-mongo-models'].Device;
  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Part = server.plugins['hapi-mongo-models'].Part;
  const Assembly = server.plugins['hapi-mongo-models'].Assembly;
  const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Module = server.plugins['hapi-mongo-models'].Module;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;
  const Annotation = server.plugins['hapi-mongo-models'].Annotation;
  const Role = server.plugins['hapi-mongo-models'].Role;

  server.route({
    method: 'PUT',
    path: '/device',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {

          var role = request.payload.role;
          if (role !== undefined && role !== null) {

            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      }],
      validate: {
        payload: {
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().uppercase().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parts: Joi.array().items(Joi.object().keys({
            name: Joi.string(),
            description: Joi.string(),
            displayId: Joi.string(),
            _id: Joi.string()
          })).optional(), // List of Part objects. (not subparts)
          parameters: Joi.array().items(Joi.object().keys({
            name: Joi.string().optional(),
            units: Joi.string(), // These should be updated.
            value: Joi.number(),
            variable: Joi.string()
          })).optional(),
          userSpace: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {

      Async.auto({
        findSequences: function (done) {

          // Retrieves sequence document(s) using Sequence string.
          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            Sequence.getSequenceBySequenceString(request.payload.sequence, done);
          } else {
            return done(null, []);
          }
        },
        findSubParts: ['findSequences', function (results, done) {


          // get Sequence ids from array
          var seqArr = results.findSequences;
          var partIds = [];
          for (var i = 0; i < seqArr.length; ++i) {
            if (seqArr[i]['partId'] !== undefined && seqArr[i]['partId'] !== null) {
              partIds.push((seqArr[i]['partId']).toString());
            }
          }

          if (request.payload.sequence !== undefined && request.payload.sequence !== null && partIds.length > 0) {
            // then query all sequences' part ids
            Part.getParts(partIds, done);

          } else {
            return done(null, []);
          }

        }],
        findParameters: ['findSubParts', function (results, done) {


          // using part documents from last step, get biodesigns
          var resultsArray = results.findSubParts;
          var bioDesignIds = [];


          if (resultsArray !== null) {
            for (var i = 0; i < resultsArray.length; ++i) {
              if (resultsArray[i]['bioDesignId'] !== undefined && resultsArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(resultsArray[i]['bioDesignId'].toString());
              } else if (typeof resultsArray[i] == 'string') {
                // Prior steps found multiple bd ids, but sequence/part was undefined.
                bioDesignIds.push(resultsArray[i]);
              }
            }
          }

          // only zero/one result, no need to search further
          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
              //return reply({'debug': results});
            }

          }


          // otherwise keep going with parameters search
          if (request.payload.parameters !== null && request.payload.parameters !== undefined) {
            Parameter.getParameterByBioDesignId(bioDesignIds, request.payload.parameters, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findModules: ['findParameters', function (results, done) {

          // collect bioDesign Ids
          var resultsArray = results.findParameters;
          var bioDesignIds = [];
          if (resultsArray != null) {
            for (var i = 0; i < resultsArray.length; ++i) {
              if (resultsArray[i]['bioDesignId'] !== undefined && resultsArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(resultsArray[i]['bioDesignId'].toString());
              } else if (typeof resultsArray[i] == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(resultsArray[i]);
              }
            }
          }

          // only zero/one result, no need to search further
          if ((request.payload.sequence !== undefined && request.payload.sequence !== null) || (request.payload.parameters != undefined && request.payload.parameters !== null)) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
              //return reply({'debug': results});
            }

          }


          // otherwise perform module search
          if (request.payload.role !== undefined && request.payload.role !== null) {
            Module.getModuleByBioDesignId(bioDesignIds, {role: request.payload.role}, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findParts: ['findModules', function (results, done) {

          var resultsArray = results.findModules;
          var bioDesignIds = [];


          if (resultsArray !== null) {
            for (var i = 0; i < resultsArray.length; ++i) {
              if (resultsArray[i]['bioDesignId'] !== undefined && resultsArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(resultsArray[i]['bioDesignId'].toString());
              } else if (typeof resultsArray[i] == 'string') {
                // Prior steps found multiple bd ids, but sequence/part was undefined.
                bioDesignIds.push(resultsArray[i]);
              }
            }
          }

          // Equivalent of finding subdesigns
          // Match by subdesigns id, name, displayId, etc.
          // Return list of parent biodesigns.
          // To do - add parts !== undefined to other sections of async call.
          if (request.payload.parts !== undefined && request.payload.parts !== null) {
            BioDesign.getSubDesignByBioDesignId(bioDesignIds, request.payload.parts, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findBioDesigns: ['findParts', function (results, done) {


          // collect biodesign Ids
          var resultsArray = results.findParts;
          var bioDesignIds = [];
          if (resultsArray != null && resultsArray.length > 0) {
            for (let result of resultsArray) {
              if (result['bioDesignId'] !== undefined && result['bioDesignId'] !== null) {
                bioDesignIds.push(result['bioDesignId'].toString());
              } else if (result['superBioDesignId'] !== undefined && result['superBioDesignId'] !== null) {
                bioDesignIds.push(result['superBioDesignId']);
              } else if (typeof result == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(result);
              }
            }
          }


          // No result, no need to search further
          if ((request.payload.sequence !== undefined || request.payload.parameters != undefined) || (request.payload.role !== undefined && request.payload.role !== null)) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
              //return reply({'debug': results});
            }
          }

          var query = {};
          if (request.payload.name !== undefined) {
            query['name'] = request.payload.name;
          }

          if (request.payload.displayId !== undefined) {
            query['displayId'] = request.payload.displayId;
          }

          // Should not return anything if all arguments are empty.
          if (request.payload.name === undefined && request.payload.displayId === undefined
            && request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined && request.payload.parts) {
            return done(null, []);
          } else {
            // Get full biodesigns.
            return BioDesign.getBioDesignIds(bioDesignIds, query, true, done);
          }


        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (results.findBioDesigns.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        //return reply(results);
        return reply(results.findBioDesigns);
      });
    }
  });


  /**
   * @api {post} /api/device Get Device
   * @apiName Get Device
   * @apiDescription Get device based on bioDesignId
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [userId]  id of user.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String} [createSeqFromParts]  boolean to differentiate device from part - may not be necessary
   * @apiParam (Object) [partIds]  list of partIds
   *
   * @apiParamExample {json} Request-Example:
   * http://localhost:9000/api/device/59764361b06d2654210a7895
   *
   * @apiSuccessExample {string} Success-Response:
   *
   [{
       "_id": "59764361b06d2654210a7895",
       "name": "B001",
       "description": null,
       "userId": "593f0d81b59d9120de14d897",
       "displayId": "sample",
       "imageURL": null,
       "subBioDesignIds": [
           "596fa7165fe2743c2a5c4f76",
           "596fa73a5fe2743c2a5c4f7d",
           "5963d15239f53707ea81993a"
       ],
       "superBioDesignId": null,
       "type": "DEVICE",
       "subparts": [
           {
               "_id": "59764361b06d2654210a7898",
               "name": "B001",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "bioDesignId": "59764361b06d2654210a7895",
               "assemblies": [
                   {
                       "_id": "59764361b06d2654210a7899",
                       "subBioDesignIds": [
                           "596fa7165fe2743c2a5c4f76",
                           "596fa73a5fe2743c2a5c4f7d",
                           "5963d15239f53707ea81993a"
                       ],
                       "userId": "593f0d81b59d9120de14d897",
                       "superSubPartId": "59764361b06d2654210a7898"
                   }
               ],
               "sequences": [
                   {
                       "_id": "59764361b06d2654210a789a",
                       "name": "B001",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "featureId": "59764361b06d2654210a789f",
                       "partId": "59764361b06d2654210a7898",
                       "sequence": "DDDDDDDDDDDDDGGGGGGGGGGCCCCCCCC",
                       "isLinear": null,
                       "isSingleStranded": null,
                       "subannotations": [
                           {
                               "_id": "59764361b06d2654210a789b",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": null,
                               "superSequenceId": "59764361b06d2654210a789a",
                               "start": 1,
                               "end": 13,
                               "isForwardStrand": true
                           },
                           {
                               "_id": "59764361b06d2654210a789c",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": null,
                               "superSequenceId": "59764361b06d2654210a789a",
                               "start": 14,
                               "end": 23,
                               "isForwardStrand": true
                           },
                           {
                               "_id": "59764361b06d2654210a789d",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": null,
                               "superSequenceId": "59764361b06d2654210a789a",
                               "start": 24,
                               "end": 31,
                               "isForwardStrand": true
                           }
                       ],
                       "annotations": [
                           {
                               "_id": "59764361b06d2654210a789e",
                               "name": "B001",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "sequenceId": "59764361b06d2654210a789a",
                               "superSequenceId": null,
                               "start": 1,
                               "end": 31,
                               "isForwardStrand": true,
                               "features": [
                                   {
                                       "_id": "59764361b06d2654210a789f",
                                       "name": "B001",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "displayId": "sample",
                                       "role": "MODULE",
                                       "annotationId": "59764361b06d2654210a789e",
                                       "superAnnotationId": null,
                                       "moduleId": "59764361b06d2654210a7897"
                                   }
                               ]
                           }
                       ]
                   }
               ]
           }
       ],
       "modules": [
           {
               "_id": "59764361b06d2654210a7897",
               "name": "B001",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "bioDesignId": "59764361b06d2654210a7895",
               "role": "MODULE",
               "submoduleIds": null,
               "features": [
                   {
                       "_id": "59764361b06d2654210a789f",
                       "name": "B001",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "role": "MODULE",
                       "annotationId": "59764361b06d2654210a789e",
                       "superAnnotationId": null,
                       "moduleId": "59764361b06d2654210a7897"
                   }
               ]
           }
       ],
       "parameters": [
           {
               "_id": "59764361b06d2654210a7896",
               "name": null,
               "userId": "593f0d81b59d9120de14d897",
               "bioDesignId": "59764361b06d2654210a7895",
               "value": 20,
               "variable": "cm",
               "units": null
           }
       ],
       "subdesigns": [
           {
               "_id": "5963d15239f53707ea81993a",
               "name": "TEST3",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "imageURL": null,
               "subBioDesignIds": null,
               "superBioDesignId": "59776aea15d1c358a3f2940b",
               "subparts": [
                   {
                       "_id": "5963d15239f53707ea81993d",
                       "name": "TEST3",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "5963d15239f53707ea81993a",
                       "assemblyId": "59776aea15d1c358a3f2940f",
                       "sequences": [
                           {
                               "_id": "5963d15239f53707ea81993e",
                               "name": "TEST3",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "featureId": "5963d15239f53707ea819940",
                               "partId": "5963d15239f53707ea81993d",
                               "sequence": "CCCCCCCC",
                               "isLinear": null,
                               "isSingleStranded": null,
                               "annotations": [
                                   {
                                       "_id": "5963d15239f53707ea81993f",
                                       "name": "TEST3",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "sequenceId": "5963d15239f53707ea81993e",
                                       "start": 1,
                                       "end": 8,
                                       "isForwardStrand": true,
                                       "features": [
                                           {
                                               "_id": "5963d15239f53707ea819940",
                                               "name": "TEST3",
                                               "description": null,
                                               "userId": "593f0d81b59d9120de14d897",
                                               "displayId": "sample",
                                               "role": "PROMOTER",
                                               "annotationId": "5963d15239f53707ea81993f",
                                               "moduleId": "5963d15239f53707ea81993c",
                                               "superAnnotationId": "59776aea15d1c358a3f29413"
                                           }
                                       ]
                                   }
                               ]
                           }
                       ]
                   }
               ],
               "modules": [
                   {
                       "_id": "5963d15239f53707ea81993c",
                       "name": "TEST3",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "5963d15239f53707ea81993a",
                       "role": "PROMOTER",
                       "submoduleIds": null,
                       "features": [
                           {
                               "_id": "5963d15239f53707ea819940",
                               "name": "TEST3",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "role": "PROMOTER",
                               "annotationId": "5963d15239f53707ea81993f",
                               "moduleId": "5963d15239f53707ea81993c",
                               "superAnnotationId": "59776aea15d1c358a3f29413"
                           }
                       ]
                   }
               ],
               "parameters": [
                   {
                       "_id": "5963d15239f53707ea81993b",
                       "name": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "bioDesignId": "5963d15239f53707ea81993a",
                       "value": 20,
                       "variable": "cm",
                       "units": null
                   }
               ]
           },
           {
               "_id": "596fa7165fe2743c2a5c4f76",
               "name": "secondTEST1",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "imageURL": null,
               "subBioDesignIds": null,
               "superBioDesignId": "59776aea15d1c358a3f2940b",
               "type": "PART",
               "subparts": [
                   {
                       "_id": "596fa7165fe2743c2a5c4f79",
                       "name": "secondTEST1",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa7165fe2743c2a5c4f76",
                       "assemblyId": "59776aea15d1c358a3f2940f",
                       "sequences": [
                           {
                               "_id": "596fa7165fe2743c2a5c4f7a",
                               "name": "secondTEST1",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "featureId": "596fa7165fe2743c2a5c4f7c",
                               "partId": "596fa7165fe2743c2a5c4f79",
                               "sequence": "DDDDDDDDDDDDD",
                               "isLinear": null,
                               "isSingleStranded": null,
                               "annotations": [
                                   {
                                       "_id": "596fa7165fe2743c2a5c4f7b",
                                       "name": "secondTEST1",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "sequenceId": "596fa7165fe2743c2a5c4f7a",
                                       "superSequenceId": null,
                                       "start": 1,
                                       "end": 13,
                                       "isForwardStrand": true,
                                       "features": [
                                           {
                                               "_id": "596fa7165fe2743c2a5c4f7c",
                                               "name": "secondTEST1",
                                               "description": null,
                                               "userId": "593f0d81b59d9120de14d897",
                                               "displayId": "sample",
                                               "role": "PROMOTER",
                                               "annotationId": "596fa7165fe2743c2a5c4f7b",
                                               "superAnnotationId": "59776aea15d1c358a3f29411",
                                               "moduleId": "596fa7165fe2743c2a5c4f78"
                                           }
                                       ]
                                   }
                               ]
                           }
                       ]
                   }
               ],
               "modules": [
                   {
                       "_id": "596fa7165fe2743c2a5c4f78",
                       "name": "secondTEST1",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa7165fe2743c2a5c4f76",
                       "role": "PROMOTER",
                       "submoduleIds": null,
                       "features": [
                           {
                               "_id": "596fa7165fe2743c2a5c4f7c",
                               "name": "secondTEST1",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "role": "PROMOTER",
                               "annotationId": "596fa7165fe2743c2a5c4f7b",
                               "superAnnotationId": "59776aea15d1c358a3f29411",
                               "moduleId": "596fa7165fe2743c2a5c4f78"
                           }
                       ]
                   }
               ],
               "parameters": [
                   {
                       "_id": "596fa7165fe2743c2a5c4f77",
                       "name": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "bioDesignId": "596fa7165fe2743c2a5c4f76",
                       "value": 300,
                       "variable": "cm",
                       "units": null
                   }
               ]
           },
           {
               "_id": "596fa73a5fe2743c2a5c4f7d",
               "name": "secondTEST2",
               "description": null,
               "userId": "593f0d81b59d9120de14d897",
               "displayId": "sample",
               "imageURL": null,
               "subBioDesignIds": null,
               "superBioDesignId": "59776aea15d1c358a3f2940b",
               "type": "PART",
               "subparts": [
                   {
                       "_id": "596fa73a5fe2743c2a5c4f80",
                       "name": "secondTEST2",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa73a5fe2743c2a5c4f7d",
                       "assemblyId": "59776aea15d1c358a3f2940f",
                       "sequences": [
                           {
                               "_id": "596fa73a5fe2743c2a5c4f81",
                               "name": "secondTEST2",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "featureId": "596fa73a5fe2743c2a5c4f83",
                               "partId": "596fa73a5fe2743c2a5c4f80",
                               "sequence": "GGGGGGGGGG",
                               "isLinear": null,
                               "isSingleStranded": null,
                               "annotations": [
                                   {
                                       "_id": "596fa73a5fe2743c2a5c4f82",
                                       "name": "secondTEST2",
                                       "description": null,
                                       "userId": "593f0d81b59d9120de14d897",
                                       "sequenceId": "596fa73a5fe2743c2a5c4f81",
                                       "superSequenceId": null,
                                       "start": 1,
                                       "end": 10,
                                       "isForwardStrand": true,
                                       "features": [
                                           {
                                               "_id": "596fa73a5fe2743c2a5c4f83",
                                               "name": "secondTEST2",
                                               "description": null,
                                               "userId": "593f0d81b59d9120de14d897",
                                               "displayId": "sample",
                                               "role": "PROMOTER",
                                               "annotationId": "596fa73a5fe2743c2a5c4f82",
                                               "superAnnotationId": "59776aea15d1c358a3f29412",
                                               "moduleId": "596fa73a5fe2743c2a5c4f7f"
                                           }
                                       ]
                                   }
                               ]
                           }
                       ]
                   }
               ],
               "modules": [
                   {
                       "_id": "596fa73a5fe2743c2a5c4f7f",
                       "name": "secondTEST2",
                       "description": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "displayId": "sample",
                       "bioDesignId": "596fa73a5fe2743c2a5c4f7d",
                       "role": "PROMOTER",
                       "submoduleIds": null,
                       "features": [
                           {
                               "_id": "596fa73a5fe2743c2a5c4f83",
                               "name": "secondTEST2",
                               "description": null,
                               "userId": "593f0d81b59d9120de14d897",
                               "displayId": "sample",
                               "role": "PROMOTER",
                               "annotationId": "596fa73a5fe2743c2a5c4f82",
                               "superAnnotationId": "59776aea15d1c358a3f29412",
                               "moduleId": "596fa73a5fe2743c2a5c4f7f"
                           }
                       ]
                   }
               ],
               "parameters": [
                   {
                       "_id": "596fa73a5fe2743c2a5c4f7e",
                       "name": null,
                       "userId": "593f0d81b59d9120de14d897",
                       "bioDesignId": "596fa73a5fe2743c2a5c4f7d",
                       "value": 0.03,
                       "variable": "cm",
                       "units": null
                   }
               ]
           }
       ]
   }
   ]
   *
   * @apiErrorExample
   *
   * TBD
   */




  server.route({
    method: 'GET',
    path: '/device/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BioDesign.getBioDesignIds(request.params.id, null, null, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign || bioDesign.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        return reply(bioDesign);

      });
    }
  });


  /**
   * @api {post} /api/device Create Device
   * @apiName Create Device
   * @apiDescription Create device based on arguments and part ids
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [userId]  id of user.
   * @apiParam {String} [role]  role of the feature
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {String} [createSeqFromParts]  boolean to differentiate device from part - may not be necessary
   * @apiParam (Object) [partIds]  list of partIds
   *
   * @apiParamExample {json} Request-Example:
   *
   {
       "name": "B001",
       "parameters": [
           {"value": 20,
           "variable": "cm"
           }
       ],
       "role": "MODULE",
       "displayId": "sample",
       "createSeqFromParts": "true",
       "partIds": ["596fa7165fe2743c2a5c4f76","596fa73a5fe2743c2a5c4f7d","596fa74b5fe2743c2a5c4f84"]
   }
   *
   * List of partIds was compiled from creating parts and collecting their bioDesignIds.
   * Replace with bioDesignIds from locally created parts
   *
   * @apiSuccessExample {string} Success-Response:
   * 596fb1a516da153d08ed51b0
   *
   * @apiErrorExample {json} Error-Response 1 - Invalid role:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Role invalid."
   *  }
   */


  server.route({
    method: 'POST',
    path: '/device',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkrole',
        method: function (request, reply) {

          var role = request.payload.role;
          if (role !== undefined && role !== null) {

            Role.checkValidRole(role, (err, results) => {

              if (err || !results) {
                return reply(Boom.badRequest('Role invalid.'));
              } else {
                reply(true);
              }
            });
          } else {
            reply(true);
          }
        }
      }],
      validate: {
        payload: {
          name: Joi.string().required(),
          userId: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().uppercase().optional(),
          partIds: Joi.array().items(Joi.string().required()).required(),
          createSeqFromParts: Joi.boolean().required(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional()
        }
      }
    },

    handler: function (request, reply) {

      //Used to create a Device consisting of a BioDesign, Part, and Assembly.
      // Optionally, may also create a Sequence, Feature, BasicModule, Parameters, and Annotations.
      //async.auto task `createAssembly` has a non-existent dependency `createSubAssemblyIds`
      // in createSubpart, createSubAssemblyIds
      //noinspection JSDuplicatedDeclaration
      Async.auto({
        createBioDesign: function (done) {

          var subBioDesignIds = request.payload.partIds;

          BioDesign.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            null, //imageUrl
            subBioDesignIds,
            null, //superBioDesignIds
            'DEVICE',
            done);
        },
        updateSubBioDesignSuperDesign: ['createBioDesign', function (results, done) {

          // Need to update superDesign that belong to subdesigns
          // so that they have new bioDesginId associated
          var superBioDesignId = results.createBioDesign._id.toString();
          var subBioDesignIds = request.payload.partIds;

          if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
            var allPromises = [];

            for (var i = 0; i < subBioDesignIds.length; ++i) {
              var promise = new Promise((resolve, reject) => {

                BioDesign.findOneAndUpdate({
                  _id: ObjectID(subBioDesignIds[i]),
                  $isolated: 1
                }, {$set: {superBioDesignId: superBioDesignId}}, (err, results) => {

                  if (err) {
                    reject(err);
                  } else {
                    resolve(results);
                  }
                });
              });
              allPromises.push(promise);
            }
            Promise.all(allPromises).then((resolve, reject) => {

              if (reject) {
                reply(reject);
              }
              done(null, resolve);
            });
          } else {
            done(null, []);
          }

        }],
        createParameters: ['createBioDesign', function (results, done) {

          if (request.payload.parameters !== undefined && request.payload.parameters !== null) {

            var bioDesignId = results.createBioDesign._id.toString();
            var param = request.payload.parameters;
            var parameterLabels = ['name', 'value', 'variable', 'units'];

            for (let p of param) {
              for (let label of parameterLabels) {
                if (p[label] === undefined) {
                  p[label] = null;
                }
              }
            }

            var allPromises = [];
            for (var i = 0; i < param.length; ++i) {
              var promise = new Promise((resolve, reject) => {

                Parameter.create(
                  param[i]['name'],
                  request.auth.credentials.user._id.toString(),
                  bioDesignId,
                  param[i]['value'],
                  param[i]['variable'],
                  param[i]['units'],
                  (err, results) => {

                    if (err) {
                      reject(err);
                    } else {
                      resolve(results);
                    }
                  });
              });
              allPromises.push(promise);
            }

            Promise.all(allPromises).then((resolve, reject) => {

              done(null, resolve);
            });
          }
          else {
            done(null, []);
          }
        }],
        createModule: ['createBioDesign', function (results, done) {

          if (request.payload.role !== undefined && request.payload.role !== null) {
            var bioDesignId = results.createBioDesign._id.toString();

            Module.create(
              request.payload.name,
              null, // description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              bioDesignId,
              request.payload.role,
              null, // no submoduleIds
              done);
          }
          else {
            done(null, []);
          }
        }],
        createSubpart: ['createBioDesign', function (results, done) {

          var bioDesignId = results.createBioDesign._id.toString();

          Part.create(
            request.payload.name,
            null, // no description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            bioDesignId,
            done);
        }],
        createAssembly: ['createSubpart', function (results, done) {

          // Links assembly to subpart of current Device.

          var superSubPartId = results.createSubpart._id.toString();
          var subBioDesignIds = request.payload.partIds;

          if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
            Assembly.create(
              subBioDesignIds,
              request.auth.credentials.user._id.toString(),
              superSubPartId,
              done);
          } else {
            done(null, []);
          }
        }],
        updateSubDesignSubParts: ['createAssembly', function (results, done) {

          // Need to update subparts that belong to subdesigns
          // so that they have new assemblyId associated
          var assemblyId = results.createAssembly._id.toString();
          var subBioDesignIds = request.payload.partIds;

          if (subBioDesignIds !== undefined && subBioDesignIds !== null) {
            var allPromises = [];


            for (var i = 0; i < subBioDesignIds.length; ++i) {
              var promise = new Promise((resolve, reject) => {

                Part.updateMany({
                  bioDesignId: subBioDesignIds[i],
                  $isolated: 1
                }, {$set: {assemblyId: assemblyId}}, (err, results) => {

                  if (err) {
                    reject(err);
                  } else {
                    resolve(results);
                  }
                });
              });
              allPromises.push(promise);
            }

            Promise.all(allPromises).then((resolve, reject) => {

              if (reject) {
                reply(reject);
              }

              done(null, resolve);
            });
          } else {
            done(null, []);
          }

        }],
        getSubSubPartIds: ['createSubpart', function (results, done) {

          var subBioDesignIds = request.payload.partIds;
          var allPromises = [];
          var subSubPartIds = {};

          for (var i = 0; i < subBioDesignIds.length; ++i) {
            var promise = new Promise((resolve, reject) => {

              //sends value i to function so that order is kept track of
              Part.findByBioDesignIdOnly(i, subBioDesignIds[i], (err, results) => {

                if (err) {
                  reject(err);



                } else {

                  var key = results[0];  //i is returned here, partId is saved under i
                  var resPart = results[1];

                  // if (resPart.length !== 0) {
                    var subSubPartId = resPart[0]['_id'];
                    subSubPartIds[key] = subSubPartId;
                  // }
                  // else {
                  //   done(null, key)
                  // }
                  resolve(results);
                }
              });
            });
            allPromises.push(promise);
          }
          Promise.all(allPromises).then((resolve, reject) => {

            if (reject) {
              reply(reject);
            }
            done(null, subSubPartIds);
          });


        }],
        getSequences: ['createSubpart', 'getSubSubPartIds', function (results, done) {

          //get all subSequences!
          var subSubPartIds = results.getSubSubPartIds;
          var subBioDesignIds = request.payload.partIds;
          var allPromises = [];

          //array for exact length created to
          var subSequenceIds = Array.apply(null, Array(subBioDesignIds.length)).map(String.prototype.valueOf,'0');
          var superSequenceArr = Array.apply(null, Array(subBioDesignIds.length)).map(String.prototype.valueOf,'0');
          var subFeatureIds = Array.apply(null, Array(subBioDesignIds.length)).map(String.prototype.valueOf,'0');

          for (var i = 0; i < subBioDesignIds.length; ++i) {
            var promise = new Promise((resolve, reject) => {

              //sends value i to function so that order is kept track of
              Sequence.findByPartIdOnly(i, subSubPartIds[i], (err, results) => {

                if (err) {
                  return reject(err);
                }
                else if (results[1].length == 0){
                  var key = results[0];
                  superSequenceArr[key] = null; //null string
                  subSequenceIds[key] = null;
                  subFeatureIds[key] = null;

                  resolve(results);
                }

                else {
                  var key = results[0];
                  superSequenceArr[key] = results[1][0]['sequence'];
                  subSequenceIds[key] = results[1][0]['_id'];
                  subFeatureIds[key] = results[1][0]['featureId'];

                  resolve(results);
                }
              });
            });
            allPromises.push(promise);
          }
          Promise.all(allPromises).then((resolve, reject) => {

            if (reject) {
              reply(reject);
            }
            done(null, [subSequenceIds, superSequenceArr, subFeatureIds]);
          });

        }],
        createSequence: ['createSubpart', 'getSequences', function (results, done) {

          //get all subSequences and concatenates them to create the superSequence!
          var partId = results.createSubpart._id.toString();
          var sequences = results.getSequences;

          var superSequenceArr = sequences[1];
          var subBioDesignIds = request.payload.partIds;

          var superSequence = superSequenceArr.join('');

          Sequence.create(
            request.payload.name,
            null, // no description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            null, // featureId null
            partId,
            superSequence, //combination of sequences
            null,//isLinear
            null,//isSingleStranded
            done);
        }],
        createSubAnnotations: ['createSequence', 'getSequences', function (results, done) {

          // Create subAnnotations for all subBioDesigns connected to subFeatures
          var superSequenceId = results.createSequence._id.toString();
          var superSequenceArr = results.getSequences[1];

          var allPromises = [];
          var position = 1; //sequences start at 1

          var subAnnotationIds = Array.apply(null, Array(superSequenceArr.length)).map(String.prototype.valueOf,'0');

          for (var i = 0; i < superSequenceArr.length; ++i) {

            if (superSequenceArr[i] !== null) {

              var promise = new Promise((resolve, reject) => {

                var subSequence = superSequenceArr[i];
                var subSequenceLength = subSequence.length;
                var start = position;
                var end = position + subSequenceLength - 1;
                position = end + 1; //setup for next annotation

                Annotation.createWithIndex(
                  i,
                  request.payload.name,
                  null, // description,
                  request.auth.credentials.user._id.toString(),
                  null, //sequenceId
                  superSequenceId, // superSequenceId
                  start, // start
                  end, // end
                  true, // isForwardString
                  (err, results) => {

                    if (err) {
                      reject(err);
                    } else {
                      var key = results[0];
                      //calling createDevice  multiple times will create multiple annotations per feature
                      //saving id of specific annotation when created is important!
                      subAnnotationIds[key] = results[1]._id.toString();
                      resolve(results[1]);
                    }
                  });
              });
            }
            allPromises.push(promise);
          }

          Promise.all(allPromises).then((resolve, reject) => {

            if (reject) {
              reply(reject);
            }
            done(null, subAnnotationIds);
          });
        }],
        updateSubFeaturesSuperAnnotationId: ['getSequences', 'createSubAnnotations', function (results, done) {

          // Update superAnnotationIds in order in all subFeatures
          //get featuresIds from getSequences and use to update subFeatureAnnotationIds

          var subFeatureIds = results.getSequences[2];
          var subAnnotationIds = results.createSubAnnotations;
          var allPromises = [];

          for (var i = 0; i < subFeatureIds.length; ++i) {

            var promise = new Promise((resolve, reject) => {

              Feature.findOneAndUpdate({
                _id: ObjectID(subFeatureIds[i]),
                $isolated: 1
              }, {$set: {superAnnotationId: subAnnotationIds[i]}}, (err, results) => {

                if (err) {
                  reject(err);
                } else {
                  resolve(results);
                }
              });
            });
            allPromises.push(promise);
          }
          Promise.all(allPromises).then((resolve, reject) => {

            if (reject) {
              reply(reject);
            }
            done(null, resolve);
          });
        }],
        createAnnotation: ['createSequence', function (results, done) {

          var seq = results.createSequence._id.toString();
          var sequenceLength = results.createSequence.sequence.length;
          if (sequenceLength !== undefined && request.payload.sequence !== null && sequenceLength !== 0) {

            Annotation.create(
              request.payload.name,
              null, // description,
              request.auth.credentials.user._id.toString(),
              seq, // sequenceId
              null, //superSequenceId - never updated, null indicates it is directly part of a part or device
              1, // start
              sequenceLength, // end
              true, // isForwardString
              done);
          }
          else {
            return done(null, []);
          }
        }],
        createFeature: ['createModule', 'createAnnotation', function (results, done) {

          var annotationId = null, moduleId = null;
          if (results.createAnnotation._id !== undefined) {
            annotationId = results.createAnnotation._id.toString();
          }

          if (results.createModule._id !== undefined) {
            moduleId = results.createModule._id.toString();
          }

          Feature.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            request.payload.role,
            annotationId,
            null, //superAnnotationId
            moduleId,
            done);
        }],
        updateSequenceFeatureId: ['createFeature', 'createSequence', function (results, done) {

          if (results.createFeature) {
            var featureId = results.createFeature._id.toString();
            var sequenceId = results.createSequence._id.toString();

            Sequence.findOneAndUpdate({
              _id: ObjectID(sequenceId),
              $isolated: 1
            }, {$set: {featureId: featureId}}, (err, results) => {

              if (err) {
                return reply(err);
              } else {
                done(null, results);
              }
            });
          } else {
            done(null, results);
          }

        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        // return reply(results);
        return reply(results.createBioDesign._id.toString());
      });
    }
  });


  server.route({
    method: 'DELETE',
    path: '/device/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      Device.findByIdAndDelete(request.params.id, (err, device) => {

        if (err) {
          return reply(err);
        }

        if (!device) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({message: 'Success.'});
      });
    }
  });

  next();
};


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'device'
};
