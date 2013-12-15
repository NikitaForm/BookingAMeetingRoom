var mongoose    = require('mongoose');
var log         = require('./log')(module);
var config      = require('./config');

mongoose.connect(config.get('mongoose:uri'));
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

var recordSchema = new Schema({
    room: String,
    date: String,
    hours: Array
});

var RecordModel = mongoose.model('Record', recordSchema);

module.exports.RecordModel = RecordModel;