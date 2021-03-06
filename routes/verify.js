var User = require('../models/user');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config.js');

exports.getToken = function (user) {
    return jwt.sign(user, config.secretKey, {
        expiresIn: 86400
    });
};

exports.verifyOrdinaryUser = function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    var tokenExpirationIgnore = req.headers['token-expiration-ignore'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, config.secretKey, function (err, decoded) {
            if (err) {
                console.log('Error: ' + err.message);
                // WARNING!!! This it a dirty hack!!!
                if (err.message === "jwt expired" && tokenExpirationIgnore === "true"){
                    console.log("Token expired, but valid, the request will be served!!!");
                    console.log("Decoding token, attempt #2");
                    jwt.verify(token, config.secretKey, {ignoreExpiration: 'true'}, function (err, decoded) {
                        if (err) {
                            var err = new Error('You are not authenticated! #2');
                            err.status = 401;
                            return next(err);
                        } else {
                            // if everything is good, save to request for use in other routes
                            req.decoded = decoded;
                            next();
                        }
                    });
                } else {
                    var err = new Error('You are not authenticated!');
                    err.status = 401;
                    return next(err);
                }
            } else {
                console.log(decoded);
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an error
        var err = new Error('No token provided!');
        err.status = 403;
        return next(err);
    }
};

exports.verifyAdmin = function (req, res, next) {
    // if the token is decoded the userinfo is in req.decoded._doc
        //console.log(req.decoded._doc);
        if (req.decoded.admin){
          // if everything is good, save to request for use in other routes
          next();
        } else {
          var err = new Error('You are not authorized to perform this operation!');
          err.status = 403;
          return next(err);
        }
};
