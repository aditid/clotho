'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

  server.route({
    method: 'GET',
    path: '/',
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

      var user = null;
      if (request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }
      return reply.view('index', {user: user});
    }
  });

  server.route({
    method: 'GET',
    path: '/team',
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

      var user = null;
      if (request.auth.isAuthenticated) {
        user = request.auth.credentials.user;
      }
      return reply.view('team', {user: user});
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'home',
  dependencies: 'visionary'
};
