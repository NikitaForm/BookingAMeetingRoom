var express         = require('express');
var path            = require('path');
var config          = require('./libs/config');
var log             = require('./libs/log')(module);
var RecordModel    = require('./libs/mongoose').RecordModel;
var app = express();

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, "public")));

app.use(function(req, res, next){
    res.status(404);
    log.debug('Not found URL: %s',req.url);
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
    return;
});

app.get('/receive', function(req, res) {
    var date = (req.query.date).substring(3);
    return RecordModel.find({'room': decodeURIComponent(req.query.room),
    $or: [{'date': new RegExp(date)}, {'date': 'rule'}]}, 'room date hours -_id', function (err, record) {
        if (!err) {
            return res.send(JSON.stringify(record));
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/save', function(req, res) {
    var storage = JSON.parse(req.body.storage);
    var record = {
        room: storage.room,
        date: storage.date,
        hours: storage.hours
    };
    var condition = {
        room: storage.room,
        date: storage.date
    };
    if (storage.hours.length == 0) {
        RecordModel.findOneAndRemove(condition, function (err, record) {
            if (!err) {
                log.info('record was removed');
                res.send('record was removed');
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    } else {
        RecordModel.update(condition, record, {upsert: true}, function (err) {
            if (!err) {
                log.info(record.date + ' was saved');
                res.send(record.hours);
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    }
});

app.get('/rooms', function(req, res) {
    return res.send(config.get('rooms'));
});

var port = process.env.PORT || config.get('port');
app.listen(port, function(){
    log.info('Express server listening on port ' + port);
});