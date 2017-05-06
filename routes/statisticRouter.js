var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Statistics = require('../models/statistics');
var User = require('../models/user');
var Verify = require('./verify');

var statisticRouter = express.Router();
statisticRouter.use(bodyParser.json());

statisticRouter.route('/')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.get(function (req, res, next) {
	//We need the date
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
	
    Statistics.find({'ownedBy': req.decoded._id, 'year': year, 'month': month}) // return statistics for the appropriate user
        .populate('ownedBy') //binded to template model
        .exec(function (err, statistic) {
          if (err) throw err;
          res.json(statistic);
    });
})

statisticRouter.route('/:yearMonth')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.get(function (req, res, next) {
    //Let's try to find the timesheet
    year = parseInt(req.params.yearMonth.substring(0, 4)); 
    month = parseInt(req.params.yearMonth.substring(4, 6));
    Statistics.find({'ownedBy': req.decoded._id, 'year': year, 'month': month})
        .populate('ownedBy')
        .exec(function (err, statistic) {
            if (err) next(err);
        
            if(statistic.length === 0){
                var err = new Error('The requested statistics was not found for this user!');
                err.status = 404;
                return next(err);
            } else {
                res.json(statistic);
            }
        });
})

module.exports = statisticRouter;
