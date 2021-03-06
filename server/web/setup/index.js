'use strict';
const Async = require('async');
const Joi = require('joi');
const Insert = require('../../standardData/insert');
const Admin = require('../../models/admin');
const AdminGroup = require('../../models/admin-group');
const User = require('../../models/user');
const Config = require('../../../config');
const Boom = require('boom');

const internals = {};

internals.applyRoutes = function (server, next) {


  server.route({
    method: 'GET',
    path: '/setup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: function (request, reply) {

      User.findOne({username: 'root'}, (err, rootUser) => {

        if (err) {
          return reply(err);
        }

        return reply.view('setup', {
          root: rootUser,
          user: request.auth.credentials ? request.auth.credentials.user : null
        });
      });
    }
  });

  server.route({
    method: 'POST',
    path: '/setup',
    config: {
      auth: {
        mode: 'try',
        strategy: 'session'
      },
      validate: {
        payload: {
          email: Joi.string().email().lowercase().required(),
          password: Joi.string().required()
        }
      },
      plugins: {
        'hapi-auth-cookie': {
          redirectTo: false
        }
      },
      pre:[{
        assign: 'passwordCheck',
        method: function (request, reply) {

          const password = request.payload.password;
          const requirement = Config.get('/passwordRequirements');

          if (!(password.length >= requirement.min)) {
            return reply(Boom.badRequest(`Password must be a minimum of ${requirement.min} characters`));
          }

          if (!(password.length <= requirement.max)) {
            return reply(Boom.badRequest(`Password can not exceed a maximum of ${requirement.max} characters`));
          }

          if (!((password.match(/[a-z]/g) || []).length >= requirement.lowercase)) {
            return reply(Boom.badRequest(`Password must have a minimum of ${requirement.lowercase} lowercase characters`));
          }

          if (!((password.match(/[A-Z]/g) || []).length >= requirement.uppercase)) {
            return reply(Boom.badRequest(`Password must have a minimum of ${requirement.uppercase} uppercase characters`));
          }

          if (!((password.match(/[0-9]/g) || []).length >= requirement.numeric)) {
            return reply(Boom.badRequest(`Password must have a minimum of ${requirement.numeric} numeric characters`));
          }

          reply(true);
        }
      }]
    },
    handler: function (request, reply) {

      Async.auto({
        adminGroup: function (done) {

          AdminGroup.create('Root', done);
        },
        admin: function (done) {

          const document = {
            _id: Admin.ObjectId('111111111111111111111111'),
            name: {
              first: 'Root',
              middle: '',
              last: 'Admin'
            },
            timeCreated: new Date()
          };

          Admin.insertOne(document, (err, docs) => {

            if (err) {
              return done(err, null);
            }
            done(err, docs[0]);
          });
        },
        user: function (done) {

          Async.auto({
            passwordHash: User.generatePasswordHash.bind(this, request.payload.password)
          }, (err, passResults) => {

            if (err) {
              return done(err);
            }

            const document = {
              _id: Admin.ObjectId('000000000000000000000000'),
              isActive: true,
              username: 'root',
              name: 'Root',
              password: passResults.passwordHash.hash,
              email: request.payload.email.toLowerCase(),
              timeCreated: new Date()
            };

            User.insertOne(document, (err, docs) => {

              done(err, docs[0]);
            });
          });
        },
        adminMembership: ['admin', function (dbResults, done) {

          const id = dbResults.admin._id.toString();
          const update = {
            $set: {
              groups: {
                root: 'Root'
              }
            }
          };

          Admin.findByIdAndUpdate(id, update, done);
        }],
        linkUser: ['admin', 'user', function (dbResults, done) {

          const id = dbResults.user._id.toString();
          const update = {
            $set: {
              'roles.admin': {
                id: dbResults.admin._id.toString(),
                name: 'Root Admin'
              }
            }
          };

          User.findByIdAndUpdate(id, update, done);
        }],
        linkAdmin: ['admin', 'user', function (dbResults, done) {

          const id = dbResults.admin._id.toString();
          const update = {
            $set: {
              user: {
                id: dbResults.user._id.toString(),
                name: 'root'
              }
            }
          };

          Admin.findByIdAndUpdate(id, update, done);
        }],
        insertData: ['linkAdmin', function (results, callback) {

          Insert.data();
          callback(null, null);
        }]
      }, (err, dbResults) => {

        if (err) {
          return reply(err);
        }
        return reply.redirect('/setup');
      });
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'setup',
  dependencies: 'visionary'
};
