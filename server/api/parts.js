'use strict';

const Boom = require('boom');
const Joi = require('joi');
const Async = require('async');
const ObjectID = require('mongo-models').ObjectID;

const internals = {};

internals.applyRoutes = function (server, next) {

  const Sequence = server.plugins['hapi-mongo-models'].Sequence;
  const Part = server.plugins['hapi-mongo-models'].Part;
  const Feature = server.plugins['hapi-mongo-models'].Feature;
  const Annotation = server.plugins['hapi-mongo-models'].Annotation;
  const Module = server.plugins['hapi-mongo-models'].Module;
  const BioDesign = server.plugins['hapi-mongo-models'].BioDesign;
  const Parameter = server.plugins['hapi-mongo-models'].Parameter;
  const Role = server.plugins['hapi-mongo-models'].Role;

  /**
   * @api {put} /api/part Get Part
   * @apiName Get Part
   * @apiDescription Get part based on arguments.
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} [name]  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   * @apiParam (Object) [parameters] can include "name", "units", "value", "variable"
   * @apiParam {Boolean} [userSpace=false] If userspace is true, it will only filter by your bioDesigns
   *
   * @apiParamExample {json} Request-Example:
   *  {
 "name": "BBa_R0040",
 "displayId": "TetR repressible promoter",
 "role": "PROMOTER",
 "sequence": "tccctatcagtgatagagattgacatccctatcagtgatagagatactgagcac",
 "userSpace": true,
 "parameters": [
  {
  "name": "promoter unbinding rate",
  "value": 0.03,
  "variable": "K7",
  "units": "min-1"
  },
  {
  "name": "mRNA degradation rate",
  "value": 0.02,
  "variable": "dmrna",
  "units": "min-1"
   }
 ]
}
   *
   * @apiSuccessExample {json} Success-Response:
   * [
   {
       "_id": "5952e539ed2e7c2df88b7f8a",
       "name": "BBa_R0040",
       "description": null,
       "userId": "5939ba97b8e96112986d3be8",
       "displayId": "TetR repressible promoter",
       "imageURL": null,
       "parts": [
           {
               "_id": "5952e539ed2e7c2df88b7f8e",
               "name": "BBa_R0040",
               "description": null,
               "userId": "5939ba97b8e96112986d3be8",
               "displayId": "TetR repressible promoter",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "sequences": [
                   {
                       "_id": "5952e539ed2e7c2df88b7f8f",
                       "name": "BBa_R0040",
                       "description": null,
                       "userId": "5939ba97b8e96112986d3be8",
                       "displayId": "TetR repressible promoter",
                       "featureId": null,
                       "partId": "5952e539ed2e7c2df88b7f8e",
                       "sequence": "tccctatcagtgatagagattgacatccctatcagtgatagagatactgagcac",
                       "isLinear": null,
                       "isSingleStranded": null,
                       "annotations": [
                           {
                               "_id": "5952e539ed2e7c2df88b7f90",
                               "name": "BBa_R0040",
                               "description": null,
                               "userId": "5939ba97b8e96112986d3be8",
                               "sequenceId": "5952e539ed2e7c2df88b7f8f",
                               "start": 1,
                               "end": 54,
                               "isForwardStrand": true,
                               "features": [
                                   {
                                       "_id": "5952e539ed2e7c2df88b7f91",
                                       "name": "BBa_R0040",
                                       "description": null,
                                       "userId": "5939ba97b8e96112986d3be8",
                                       "displayId": "TetR repressible promoter",
                                       "role": "PROMOTER",
                                       "annotationId": "5952e539ed2e7c2df88b7f90",
                                       "moduleId": "5952e539ed2e7c2df88b7f8d"
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
               "_id": "5952e539ed2e7c2df88b7f8d",
               "name": "BBa_R0040",
               "description": null,
               "userId": "5939ba97b8e96112986d3be8",
               "displayId": "TetR repressible promoter",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "role": "PROMOTER",
               "submoduleIds": null,
               "features": [
                   {
                       "_id": "5952e539ed2e7c2df88b7f91",
                       "name": "BBa_R0040",
                       "description": null,
                       "userId": "5939ba97b8e96112986d3be8",
                       "displayId": "TetR repressible promoter",
                       "role": "PROMOTER",
                       "annotationId": "5952e539ed2e7c2df88b7f90",
                       "moduleId": "5952e539ed2e7c2df88b7f8d"
                   }
               ]
           }
       ],
       "parameters": [
           {
               "_id": "5952e539ed2e7c2df88b7f8b",
               "name": "promoter unbinding rate",
               "userId": "5939ba97b8e96112986d3be8",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "value": 0.03,
               "variable": "K7",
               "units": "min-1"
           },
           {
               "_id": "5952e539ed2e7c2df88b7f8c",
               "name": "mRNA degradation rate",
               "userId": "5939ba97b8e96112986d3be8",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "value": 0.02,
               "variable": "dmrna",
               "units": "min-1"
           }
       ]
   }
   ]
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
   * "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
   * }
   */


  server.route({
    method: 'PUT',
    path: '/part',
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
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {

      /* const fields = request.payload.fields;
       const sort = request.payload.sort;
       const limit = request.payload.limit;
       const page = request.payload.page;
       */


      Async.auto({
        findSequences: function (done) {

          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            Sequence.getSequenceBySequenceString(request.payload.sequence, done);
          } else {
            return done(null, []);
          }
        },
        findParts: ['findSequences', function (results, done) {

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
        findParameters: ['findParts', function (results, done) {

          // using part documents from last step, get biodesigns
          var partArray = results.findParts;
          var bioDesignIds = [];


          if (partArray !== null) {
            for (var i = 0; i < partArray.length; ++i) {
              if (partArray[i]['bioDesignId'] !== undefined && partArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(partArray[i]['bioDesignId'].toString());
              } else if (typeof partArray[i] == 'string') {
                // Prior steps found multiple bd ids, but sequence/part was undefined.
                bioDesignIds.push(partArray[i]);
              }
            }
          }


          // only zero/one result, no need to search further
          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {
            if (bioDesignIds.length === 0) {
              return done(null, []);
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
          var parameterArray = results.findParameters;
          var bioDesignIds = [];
          if (parameterArray != null) {
            for (var i = 0; i < parameterArray.length; ++i) {
              if (parameterArray[i]['bioDesignId'] !== undefined && parameterArray[i]['bioDesignId'] !== null) {
                bioDesignIds.push(parameterArray[i]['bioDesignId'].toString());
              } else if (typeof parameterArray[i] == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(parameterArray[i]);
              }
            }
          }

          // only zero/one result, no need to search further
          if ((request.payload.sequence !== undefined && request.payload.sequence !== null) || (request.payload.parameters != undefined && request.payload.parameters !== null)) {
            if (bioDesignIds.length === 0) {
              return done(null, []);

            }

          }


          // otherwise perform module search
          if (request.payload.role !== undefined && request.payload.role !== null) {
            Module.getModuleByBioDesignId(bioDesignIds, {role: request.payload.role}, done);
          } else {
            done(null, bioDesignIds);
          }

        }],
        findBioDesigns: ['findModules', function (results, done) {


          // collect biodesign Ids
          var moduleArray = results.findModules;
          var bioDesignIds = [];
          if (moduleArray != null && moduleArray.length > 0) {
            for (let module of moduleArray) {
              if (module['bioDesignId'] !== undefined && module['bioDesignId'] !== null) {
                bioDesignIds.push(module['bioDesignId'].toString());
              } else if (typeof module == 'string') {
                // Prior steps found multiple bd ids, but parameter was undefined.
                bioDesignIds.push(module);
              }
            }
          }


          // No result, no need to search further
          if ((request.payload.sequence !== undefined || request.payload.parameters != undefined) || (request.payload.role !== undefined && request.payload.role !== null)) {
            if (bioDesignIds.length === 0) {
              return done(null, []);

            }
          }

          var query = {};
          if (request.payload.name !== undefined) {
            query['name'] = request.payload.name;
          }

          if (request.payload.displayId !== undefined) {
            query['displayId'] = request.payload.displayId;
          }

          if (request.payload.userSpace) {
            query['userId'] = request.auth.credentials.user._id.toString();
          }

          // Should not return anything if all arguments are empty.
          if (request.payload.name === undefined && request.payload.displayId === undefined
            && request.payload.sequence === undefined && request.payload.parameters === undefined
            && request.payload.role === undefined) {
            return done(null, []);
          } else {
            // Get full biodesigns.
            return BioDesign.getBioDesignIds(bioDesignIds, query, done);
          }


        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }

        if (results.findBioDesigns.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        return reply(results.findBioDesigns);
      });

    }
  })
  ;


  server.route({
    method: 'PUT',
    path: '/part/{filter}',
    config: {
      auth: {
        strategy: 'simple'
      },
      pre: [{
        assign: 'checkfilter',
        method: function (request, reply) {

          // Check if filter is valid.
          // TODO - update with any new biodesign attributes
          var schema = {
            filter: Joi.string().valid('parameters', 'modules', 'subparts',
              '_id', 'name', 'description', 'userId', 'displayId', 'moduleId', 'subBioDesignId', 'superBioDesignId').required()
          };
          var filter = {filter: request.params.filter};

          Joi.validate(filter, schema, (err, result) => {

            if (err === null) {
              reply(true);
            } else {
              return reply(Boom.badRequest(err));
            }
          });

        }
      }],
      validate: {
        payload: {
          sort: Joi.string().default('_id'),
          limit: Joi.number().default(20),
          page: Joi.number().default(1),
          name: Joi.string().optional(),
          displayId: Joi.string().optional(),
          role: Joi.string().optional(),
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional(),
          parameters: Joi.array().items(
            Joi.object().keys({
              name: Joi.string().optional(),
              units: Joi.string(), // These should be updated.
              value: Joi.number(),
              variable: Joi.string()
            })
          ).optional(),
          userSpace: Joi.boolean().default(false)
        }
      }
    },
    handler: function (request, reply) {

      var newRequest = {
        url: '/api/part',
        method: 'PUT',
        payload: request.payload,
        credentials: request.auth.credentials
      };

      server.inject(newRequest, (response) => {

        // Check for error. Includes no document found error.
        if (response.statusCode !== 200) {
          return reply(response.result);
        }

        // Otherwise loop through and remove keys.

        var resultArr = response.result;
        var filteredArr = [];

        const acceptedFilters = ['subparts', 'parameters', 'modules'];
        const acceptedBioDesignFilters = ['_id', 'name', 'description', 'userId', 'displayId', 'moduleId', 'subBioDesignId', 'superBioDesignId'];
        const filter = request.params.filter;

        // If filtered attribute is that of a general biodesign, only that attribute is returned. (e.g. _id)

        if (acceptedBioDesignFilters.indexOf(filter) !== -1) {
          for (let result of resultArr) {
            if (result[filter] !== undefined && result[filter] !== null) {
              filteredArr.push(result[filter]);
            } else {
              filteredArr.push(null);
            }
          }

          // Otherwise return general biodesign and attribute (e.g. parameters + general biodesign).
        } else {
          for (let result of resultArr) {
            var filteredResult = {};
            for (let key of Object.keys(result)) {
              if (acceptedFilters.indexOf(key) === -1 || key === filter) {
                filteredResult[key] = result[key];
              }
            }
            filteredArr.push(filteredResult);
          }
        }


        return reply(filteredArr);

      });
    }
  })
  ;

  /**
   * @api {get} /api/part/:id Get Part By Id
   * @apiName Get Part By Id
   * @apiDescription Get complete Part by ID
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} id Part unique ID.
   *
   * @apiSuccessExample {json} Success-Response:
   * [
   {
       "_id": "5952e539ed2e7c2df88b7f8a",
       "name": "BBa_R0040",
       "description": null,
       "userId": "5939ba97b8e96112986d3be8",
       "displayId": "TetR repressible promoter",
       "imageURL": null,
       "parts": [
           {
               "_id": "5952e539ed2e7c2df88b7f8e",
               "name": "BBa_R0040",
               "description": null,
               "userId": "5939ba97b8e96112986d3be8",
               "displayId": "TetR repressible promoter",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "sequences": [
                   {
                       "_id": "5952e539ed2e7c2df88b7f8f",
                       "name": "BBa_R0040",
                       "description": null,
                       "userId": "5939ba97b8e96112986d3be8",
                       "displayId": "TetR repressible promoter",
                       "featureId": null,
                       "partId": "5952e539ed2e7c2df88b7f8e",
                       "sequence": "tccctatcagtgatagagattgacatccctatcagtgatagagatactgagcac",
                       "isLinear": null,
                       "isSingleStranded": null,
                       "annotations": [
                           {
                               "_id": "5952e539ed2e7c2df88b7f90",
                               "name": "BBa_R0040",
                               "description": null,
                               "userId": "5939ba97b8e96112986d3be8",
                               "sequenceId": "5952e539ed2e7c2df88b7f8f",
                               "start": 1,
                               "end": 54,
                               "isForwardStrand": true,
                               "features": [
                                   {
                                       "_id": "5952e539ed2e7c2df88b7f91",
                                       "name": "BBa_R0040",
                                       "description": null,
                                       "userId": "5939ba97b8e96112986d3be8",
                                       "displayId": "TetR repressible promoter",
                                       "role": "PROMOTER",
                                       "annotationId": "5952e539ed2e7c2df88b7f90",
                                       "moduleId": "5952e539ed2e7c2df88b7f8d"
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
               "_id": "5952e539ed2e7c2df88b7f8d",
               "name": "BBa_R0040",
               "description": null,
               "userId": "5939ba97b8e96112986d3be8",
               "displayId": "TetR repressible promoter",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "role": "PROMOTER",
               "submoduleIds": null,
               "features": [
                   {
                       "_id": "5952e539ed2e7c2df88b7f91",
                       "name": "BBa_R0040",
                       "description": null,
                       "userId": "5939ba97b8e96112986d3be8",
                       "displayId": "TetR repressible promoter",
                       "role": "PROMOTER",
                       "annotationId": "5952e539ed2e7c2df88b7f90",
                       "moduleId": "5952e539ed2e7c2df88b7f8d"
                   }
               ]
           }
       ],
       "parameters": [
           {
               "_id": "5952e539ed2e7c2df88b7f8b",
               "name": "promoter unbinding rate",
               "userId": "5939ba97b8e96112986d3be8",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "value": 0.03,
               "variable": "K7",
               "units": "min-1"
           },
           {
               "_id": "5952e539ed2e7c2df88b7f8c",
               "name": "mRNA degradation rate",
               "userId": "5939ba97b8e96112986d3be8",
               "bioDesignId": "5952e539ed2e7c2df88b7f8a",
               "value": 0.02,
               "variable": "dmrna",
               "units": "min-1"
           }
       ]
   }
   ]
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
    "statusCode": 404,
    "error": "Not Found",
    "message": "Document not found."
}
   */

  server.route({
    method: 'GET',
    path: '/part/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BioDesign.getBioDesignIds(request.params.id, null, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign || bioDesign.length === 0) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply(bioDesign);

      });

    }
  });

  /**
   * @api {post} /api/part Create Part
   * @apiName Create Part
   * @apiDescription Create part based on arguments
   * @apiGroup Convenience Methods
   * @apiVersion 4.0.0
   * @apiPermission user
   *
   * @apiParam {String} name  name of part.
   * @apiParam {String} [displayId]  displayId of part.
   * @apiParam {String} [role]  role of the feature
   * @apiParam {Object} [parameters]  can include "name", "units", "value", "variable"
   * @apiParam {String=ATUCGRYKMSWBDHVN} [sequence]  nucleotide sequence using nucleic acid abbreviation. Case-insensitive.
   *
   * @apiParamExample {json} Request-Example:
   *
   *{
   * "name": "BBa_R0040",
   * "displayId": "TetR repressible promoter",
   * "role": "PROMOTER",
   * "sequence": "tccctatcagtgatagagattgacatccctatcagtgatagagatactgagcac",
   * "parameters": [
   *  {
   *  "name": "promoter unbinding rate",
   *  "value": 0.03,
   *  "variable": "K7",
   *    "units": "min-1"
   *  },
   *  {
   *    "name": "mRNA degradation rate",
   *    "value": 0.02,
   *    "variable": "dmrna",
   *    "units": "min-1"
   *   }
   * ]
   *}
   *
   * @apiSuccessExample {string} Success-Response:
   * 5952e539ed2e7c2df88b7f8a
   *
   * @apiErrorExample {json} Error-Response 1:
   * {
   *  "statusCode": 400,
   *  "error": "Bad Request",
   *  "message": "Role invalid."
   */

  server.route({
    method: 'POST',
    path: '/part',
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
          displayId: Joi.string().optional(),
          role: Joi.string().uppercase().optional(),
          parameters: Joi.array().items(Joi.object()).optional(), // assumed to be of the format (value, variable)
          sequence: Joi.string().regex(/^[ATUCGRYKMSWBDHVNatucgrykmswbdhvn]+$/, 'DNA sequence').insensitive().optional()
        }
      }
    },

    handler: function (request, reply) {

      Async.auto({
        createBioDesign: function (done) {

          BioDesign.create(
            request.payload.name,
            null, // description
            request.auth.credentials.user._id.toString(),
            request.payload.displayId,
            null, //imageURL
            null, //subBioDesignIds
            null, //superBioDesignId
            done);
        },
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
                  }
                );

              });

              allPromises.push(promise);
            }

            Promise.all(allPromises).then((resolve, reject) => {

              done(null, allPromises);
            });
          }
          else {
            return done(null, []);
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
            return done(null, []);
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
        createSequence: ['createSubpart', function (results, done) {

          if (request.payload.sequence !== undefined && request.payload.sequence !== null) {

            var partId = results.createSubpart._id.toString();

            Sequence.create(
              request.payload.name,
              null, // no description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              null, // featureId null
              partId,
              request.payload.sequence,
              null,
              null,
              done);
          }
          else {
            return done(null, []);
          }
        }],
        createAnnotation: ['createSequence', function (results, done) {

          if (request.payload.sequence !== undefined) {

            var seq = results.createSequence._id.toString();
            Annotation.create(
              request.payload.name,
              null, // description,
              request.auth.credentials.user._id.toString(),
              seq, // sequenceId
              1, // start
              request.payload.sequence.length, // end
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

          if (annotationId !== null && moduleId !== null) {
            Feature.create(
              request.payload.name,
              null, // description
              request.auth.credentials.user._id.toString(),
              request.payload.displayId,
              request.payload.role,
              annotationId,
              moduleId,
              done);
          }
          else {
            return done(null);
          }
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
                return done(null, []);
              }
            });
          }
          return done(null);

        }]
      }, (err, results) => {

        if (err) {
          return reply(err);
        }
        return reply(results.createBioDesign._id.toString());
      });
    }
  })
  ;

  server.route({
    method: 'DELETE',
    path: '/part/{id}',
    config: {
      auth: {
        strategy: 'simple',
      }
    },
    handler: function (request, reply) {

      BioDesign.findByIdAndDelete(request.params.id, (err, bioDesign) => {

        if (err) {
          return reply(err);
        }

        if (!bioDesign) {
          return reply(Boom.notFound('Document not found.'));
        }

        reply({message: 'Success.'});
      });
    }
  });

  next();
}
;


exports.register = function (server, options, next) {

  server.dependency(['auth', 'hapi-mongo-models'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'part'
};
