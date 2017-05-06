// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('mongoose-currency').loadType(mongoose);
var Currency = mongoose.Types.Currency;

var statisticSchema = new Schema({
    ownedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    year:  {
        type: Number,
        required: true
    },
    month:  {
        type: Number,
        required: true
    },
    plannedToSpend: {
        type: Currency,
        required: true
    },
    totalSpent: {
        type: Currency,
        required: true
    },
    remainToPay: {
        type: Currency,
        required: true
    },
    balance: {
        type: Currency,
        required: true
    }
}, {
    timestamps: true
});

// the schema is useless so far
// we need to create a model using it
var Statistics = mongoose.model('Statistic', statisticSchema);

// make this available to our Node applications
module.exports = Statistics;
