var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Expenses = require('../models/expenses');
var Timesheets = require('../models/timesheets');
var Statistics = require('../models/statistics');
var User = require('../models/user');
var Verify = require('./verify');

var timesheetRouter = express.Router();
timesheetRouter.use(bodyParser.json());

timesheetRouter.route('/')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.get(function (req, res, next) {
    
    //We need the date
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth();
    
    //Let's try to find the timesheet
    Timesheets.find({'ownedBy': req.decoded._id, 'year': year, 'month': month}, function (err, timesheet) {
        if (err) next(err);
        
        if(timesheet.length){
            console.log("Timesheet already created!");
            res.json(timesheet);
        } else {
            console.log("Timesheet not exists, creating a new instance!");
            Expenses.find({'ownedBy': req.decoded._id}, function(err, template){
            if (err) next(err);
            console.log(template);
            var timesheet = { 
                "ownedBy" : req.decoded._id,
                "year" : year,
                "month" : month,
                "items" : []
            }
            
            var plannedToSpend = 0; // will be needed to initialize the statistics
            for (var i=0; i<template.length; i++){
                var item = {
                    itemName: template[i].expensename,
                    amountPlanned : template[i].amount,
                    amountPaid : 0
                }
                plannedToSpend += parseFloat(template[i].amount);
                timesheet.items.push(item);
            }
                
            console.log("plannedToSpend: " + plannedToSpend);
            Timesheets.create(timesheet, function (err, timesheet) {
                if (err) next(err);
                console.log('Timesheet created!');
                // Create statistics record as well
                
                var statistic = { 
                    "ownedBy" : req.decoded._id,
                    "year" : year,
                    "month" : month,
                    "plannedToSpend": plannedToSpend,
                    "totalSpent" : 0,
                    "remainToPay" : plannedToSpend,
                    "balance": 0
                }
                
                Statistics.create(statistic, function (err, statistic) {
                    if (err) next(err);
                    console.log('Statistic entry created!');
                    
                    });
                
                res.json([timesheet]);
                });
            })
        }
        });
})

timesheetRouter.route('/:yearMonth')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.get(function (req, res, next) {
    //Let's try to find the timesheet
    year = parseInt(req.params.yearMonth.substring(0, 4)); 
    month = parseInt(req.params.yearMonth.substring(4, 6));
    Timesheets.find({'ownedBy': req.decoded._id, 'year': year, 'month': month}, function (err, timesheet) {
        if (err) next(err);
        
        if(timesheet.length === 0){
            var err = new Error('The requested timesheet was not found for this user!');
            err.status = 404;
            return next(err);
        } else {
            res.json(timesheet);
        }
        });
})

timesheetRouter.route('/:timesheetId')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.post(function (req, res, next) {

    Timesheets.findById(req.params.timesheetId, function (err, timesheet) {
        if (err) next(err);
        
        if(timesheet === null){
            var err = new Error('The requested timesheet was not found!');
            err.status = 404;
            return next(err);
        } else {
            timesheet.items.push(req.body);
            timesheet.save(function (err, timesheet) {
                if (err) next(err);
                console.log('Item Added!');
                // we have to update the statistics
                Statistics.find({'ownedBy': req.decoded._id, 'year': timesheet.year, 'month': timesheet.month}, function (err, statistic) {
                    if (err) next(err);
        
                    if(statistic.length === 0){
                        console.log('The requested statistic was not found for this user!');
                    } else {
                        
                        // this is needed because web client doesn't send amount paid, but mobile client does
                        var amountPaidAdded = 0;
                        if (!isNaN(parseFloat(req.body.amountPaid))){
                            amountPaidAdded = parseFloat(req.body.amountPaid);
                        }
                        
                        var newPlannedToSpend = parseFloat(statistic[0].plannedToSpend) + parseFloat(req.body.amountPlanned);
                        var newRemainToPay = parseFloat(statistic[0].remainToPay) + parseFloat(req.body.amountPlanned);
                        var newTotalSpent = parseFloat(statistic[0].totalSpent) + amountPaidAdded;
                        var newBalance = newPlannedToSpend - newTotalSpent;
                        console.log("newPlannedToSpend: " + newPlannedToSpend);
                        statistic[0].plannedToSpend = newPlannedToSpend;
                        statistic[0].remainToPay = newRemainToPay;
                        statistic[0].balance = newBalance;
                        statistic[0].totalSpent = newTotalSpent;
                        statistic[0].save(function (err, statistic) {
                            if (err) next(err);
                            console.log('Statistic Updated!');
                        });
                    }
                });
                res.json(timesheet);
            });   
        }
        });
})

timesheetRouter.route('/:timesheetId/:itemId')
.all(Verify.verifyOrdinaryUser) //this will decode the req

.put(function (req, res, next) {

    Timesheets.findById(req.params.timesheetId, function (err, timesheet) {
        if (err) next(err);
        
        if(timesheet === null){
            var err = new Error('The requested timesheet was not found!');
            err.status = 404;
            return next(err);
        } else {
            // put the update code here
            console.log(timesheet);
            
            if (timesheet.items.id(req.params.itemId) !== null) {
                
                var amountPlannedOld = timesheet.items.id(req.params.itemId).amountPlanned;
                var amountPaidOld = timesheet.items.id(req.params.itemId).amountPaid;
                
                var aYear = timesheet.year;
                var aMonth = timesheet.month;
                
                timesheet.items.id(req.params.itemId).remove();
                
                
                timesheet.items.push(req.body);
                timesheet.save(function (err, timesheet) {
                    if (err) next(err);
                    console.log('Item Updated!');
                    // update the statistics
                    Statistics.find({'ownedBy': req.decoded._id, 'year': aYear, 'month': aMonth}, function (err, statistic) {
                    if (err) next(err);
        
                    if(statistic.length === 0){
                        console.log('The requested statistic was not found for this user!');
                    } else {
                        var newPlannedToSpend = parseFloat(statistic[0].plannedToSpend) - amountPlannedOld + parseFloat(req.body.amountPlanned);
                        var newTotalSpent = parseFloat(statistic[0].totalSpent) + parseFloat(req.body.amountPaid) - amountPaidOld;
                        
                        var newRemainToPay = parseFloat(statistic[0].remainToPay);
                        if (amountPaidOld === 0) {
                            newRemainToPay = parseFloat(statistic[0].remainToPay) - parseFloat(req.body.amountPlanned);
                        } else {
                            newRemainToPay = parseFloat(statistic[0].remainToPay) - amountPlannedOld + parseFloat(req.body.amountPlanned);
                        }
                        var newBalance = newPlannedToSpend - newTotalSpent;
                        console.log("newPlannedToSpend: " + newPlannedToSpend);
                        statistic[0].plannedToSpend = newPlannedToSpend;
                        statistic[0].totalSpent = newTotalSpent;
                        statistic[0].remainToPay = newRemainToPay;
                        statistic[0].balance = newBalance;
                        statistic[0].save(function (err, statistic) {
                            if (err) next(err);
                            console.log('Statistic Updated!');
                        });
                    }
                });
                    res.json(timesheet);
                });
            } else {
                var err = new Error('The requested expense not found!');
                err.status = 404;
                return next(err);
            }
        }
        });
})

.delete(function (req, res, next) {
    Timesheets.findById(req.params.timesheetId, function (err, timesheet) {
        if (err) next(err);
        
        if(timesheet === null){
            var err = new Error('The requested timesheet was not found!');
            err.status = 404;
            return next(err);
        } else {
            // put the update code here
            console.log(timesheet);
            var itemDC = JSON.parse(JSON.stringify(timesheet.items.id(req.params.itemId)));
            if (itemDC !== null) {
                var amountPlannedOld = itemDC.amountPlanned;
                if (parseFloat(itemDC.amountPaid) === 0){
                    timesheet.items.id(req.params.itemId).remove();
                    timesheet.save(function (err, resp) {
                    if (err) next(err);
                        
                        console.log("Updating statistics...");
                        
                        // update the statistics
                        Statistics.find({'ownedBy': req.decoded._id, 'year': timesheet.year, 'month': timesheet.month}, function (err, statistic) {
                            if (err) next(err);
        
                            if(statistic.length === 0){
                                console.log('The requested statistic was not found for this user!');
                            } else {
                                var newPlannedToSpend = parseFloat(statistic[0].plannedToSpend) - amountPlannedOld;
                                var newRemainToPay = parseFloat(statistic[0].remainToPay) - amountPlannedOld;
                                // only amountPaid=0 can be deleted, so the amountPaid will not change
                                console.log("newPlannedToSpend: " + newPlannedToSpend);
                                statistic[0].plannedToSpend = newPlannedToSpend;
                                statistic[0].remainToPay = newRemainToPay;
                                statistic[0].save(function (err, statistic) {
                                    if (err) next(err);
                                    console.log('Statistic Updated!');
                                });
                            }
                        });
                        res.json(resp);
                    });
                    console.log('Item Deleted!');
                } else {
                    var err = new Error('Can not delete paid item!');
                    err.status = 404;
                    return next(err);
                }
            } else {
                var err = new Error('The requested expense not found!');
                err.status = 404;
                return next(err);
            }
        }
        });
})
  

module.exports = timesheetRouter;
