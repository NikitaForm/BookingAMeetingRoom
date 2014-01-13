var mongoose    = require('mongoose');
var log         = require('./log')(module);
var config      = require('./config');
var uristring = process.env.MONGOLAB_URI ||
                process.env.MONGOHQ_URL ||
                config.get('mongoose:uri');
mongoose.connect(uristring);
var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

var recordSchema = new Schema({
    userName: String,
    type: String,
    room: String,
    date: String,
    hours: String
});

var RecordModel = mongoose.model('Record', recordSchema);

module.exports.RecordModel = RecordModel;