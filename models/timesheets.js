// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;

var itemSchema = new Schema({
    itemName:  {
        type: String,
        required: true
    },
    amountPlanned:  {
        type: Currency,
        required: true
    },
    amountPaid:  {
        type: Currency,
        required: true
    },
    paid: {
        type: Boolean,
        default: false
    },
    expenseid: {
        type: String,
        default: false
    }
});

var timesheetSchema = new Schema({
    ownedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    year: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    items: [itemSchema]
}, {
    timestamps: true
});

// the schema is useless so far
// we need to create a model using it
var Timesheets = mongoose.model('Timesheet', timesheetSchema);

// make this available to our Node applications
module.exports = Timesheets;