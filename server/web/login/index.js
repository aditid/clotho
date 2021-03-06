'use strict';
const internals = {};

internals.applyRoutes = function (server, next) {

  const Session = server.plugins['hapi-mongo-models'].Session;

  server.route({
    method: 'GET',
    path: '/login',
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

      if (request.auth.isAuthenticated) {
        if (request.query.returnUrl) {
          return reply.redirect(request.query.returnUrl);
        } else {
          return reply.redirect('/');
        }
      } else {
        return reply.view('login');
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/logout',
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

      const credentials = request.auth.credentials || {session: {}};
      const session = credentials.session || {};

      Session.findByIdAndDelete(session._id, (err, sessionDoc) => {

        if (err) {
          return reply(err);
        }

        request.cookieAuth.clear();

        return reply.redirect('/');
      });
    }
  });

  server.route({
    method: 'GET',
    path: '/forgot',
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

      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      } else {
        return reply.view('forgotPassword');
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/reset',
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

      if (request.auth.isAuthenticated) {
        return reply.redirect('/');
      } else {
        return reply.view('resetPassword');
      }
    }
  });

  next();
};

exports.register = function (server, options, next) {

  server.dependency(['auth'], internals.applyRoutes);

  next();
};


exports.register.attributes = {
  name: 'login/index',
  dependencies: 'visionary'
};
