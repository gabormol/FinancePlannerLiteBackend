// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;

var expenseSchema = new Schema({
    ownedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    expensename:  {
        type: String,
        required: true
    },
    amount:  {
        type: Currency,
        required: true
    },
    frequency: {
        type: Number,
        min: 1,
        max: 12,
        required: true
    },
    createdate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// the schema is useless so far
// we need to create a model using it
var Expenses = mongoose.model('Expense', expenseSchema);

// make this available to our Node applications
module.exports = Expenses;
