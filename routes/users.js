var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Verify    = require('./verify');

/* GET users listing. */
router.route('/')
    .get(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function (req, res, next) {
        User.find({}, function (err, user) { // find everything
            if (err) {throw err; }
            res.json(user);
        });
    });

router.post('/register', function (req, res) {
    User.register(new User({ username : req.body.username }),
        req.body.password, function (err, user) {
            if (err) {
                return res.status(500).json({err: err});
            }
            if (req.body.firstname) {
                user.firstname = req.body.firstname;
            }
            if (req.body.lastname) {
                user.lastname = req.body.lastname;
            }
            if (req.body.currencysymbol) {
                user.currencySymbol = req.body.currencysymbol;
            }
            if (req.body.currencydecimals) {
                user.currencyDecimals = req.body.currencydecimals;
            }
            user.save(function (err, user) {
                passport.authenticate('local')(req, res, function () {
                    return res.status(200).json({status: 'Registration Successful!'});
                });
            });
        });
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({
                err: info
          });
        }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }

      var token = Verify.getToken({"username":user.username, "_id":user._id, "admin":user.admin});
              res.status(200).json({
        status: 'Login successful!',
        success: true,
        token: token
      });
    });
  })(req,res,next);
});

router.get('/logout', function(req, res) {
    req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

router.get('/mydata', Verify.verifyOrdinaryUser, function(req, res) {
    User.find({'_id': req.decoded._id}) // return template for the appropriate user
        .exec(function (err, profile) {
          if (err) throw err;
          res.json(profile);
    });
});

router.put('/mydata', Verify.verifyOrdinaryUser, function(req, res) {
    //console.log("LOFASZ SET USER PROPERTIES: username: " + req.decoded.username);
    var allowedData = req.body;
    
    delete allowedData.salt;
    delete allowedData.hash;
    delete allowedData.username;
    delete allowedData.admin;
    
    User.update({'username': req.decoded.username}, {
            $set: allowedData
        }, {
            upsert: true
        }, function (err, expense) {
            if (err) next(err);
            res.json(expense);
        });
    /*User.find({'_id': req.decoded._id}) // return template for the appropriate user
        .exec(function (err, profile) {
          if (err) throw err;
          res.json(profile);
    });*/
});

router.get('/facebook', passport.authenticate('facebook'),
  function(req, res){});

router.get('/facebook/callback', function(req,res,next){
  passport.authenticate('facebook', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
              var token = Verify.getToken(user);
              res.status(200).json({
        status: 'Login successful!',
        success: true,
        token: token
      });
    });
  })(req,res,next);
});

module.exports = router;
