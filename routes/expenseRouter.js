var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var Expenses = require('../models/expenses');
var User = require('../models/user');
var Verify = require('./verify');

var expenseRouter = express.Router();
expenseRouter.use(bodyParser.json());

expenseRouter.route('/')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.get(function (req, res, next) {
    Expenses.find({'ownedBy': req.decoded._id}) // return template for the appropriate user
        .populate('ownedBy') //binded to template model
        .exec(function (err, expense) {
          if (err) throw err;
          res.json(expense);
    });
})

.post(function (req, res, next) {
    var userId = req.decoded._id;
    var expenses = req.body;
    console.log("REQUEST: ");
    console.log(expenses);
    console.log("END OF REQUEST: ");
    
    var amount = 0;
    if(!isNaN(req.body.amount)){
        amount = req.body.amount; 
    }
    
    var createdExpense = {
        "ownedBy" : req.decoded._id,
        "expensename" : req.body.expensename,
	    "amount" : req.body.amount,
	    "frequency" : 12,
	    "createdate" : new Date()
    }
    
     Expenses.create(createdExpense, function (err, expense) {
        if (err) next(err);
        console.log('Expense created!');
        var id = expense._id;
        res.writeHead(200, {
            'Content-Type': 'text/plain'
        });

        res.end('Added expense with id: ' + id);
    }); 
      
  })
  

.delete(function (req, res, next) {
    Expenses.remove({ownedBy: req.decoded._id}, function (err, expenses) {
        if (err) next(err);
        console.log(expenses);
        res.json(expenses);
    });
});

expenseRouter.route('/:expenseId')
.all(Verify.verifyOrdinaryUser) //this will decode the req
.get(function (req, res, next) {
    Expenses.find({'ownedBy': req.decoded._id, '_id': req.params.expenseId})
        .populate('ownedBy')
        .exec(function (err, expense) {
        if (err) next(err);
        res.json(expense);
    });
})

.put(function (req, res, next) {
    Expenses.update({'ownedBy': req.decoded._id, '_id': req.params.expenseId}, {
        $set: req.body
    }, {
        new: true
    }, function (err, expense) {
        if (err) next(err);
        res.json(expense);
    });
})
  

.delete(function (req, res, next) {
    Expenses.remove({ownedBy: req.decoded._id, '_id': req.params.expenseId}, function (err, resp) {
        if (err) next(err);
        res.json(resp);
    });
});


module.exports = expenseRouter;
