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
    log.info('date' + date + 'date');
    return RecordModel.find({'room': decodeURIComponent(req.query.room),
    $or: [{'date': new RegExp(date)}, {'date': 'rule'}]}, 'room date hours -_id', function (err, record) {
        if (!err) {
            log.info(record + '1111111');
            if(record === null) {
                var result = 'Нет записей';
            } else {
                result = record;
            }
            return res.send(JSON.stringify(result));
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/save', function(req, res) {
    var storage = JSON.parse(req.body.storage);
    log.info(req.body.storage);
    var record = {
        room: storage.room,
        date: storage.date,
        hours: storage.hours
    };
    var condition = {
        room: storage.room,
        date: storage.date
    };
    log.info(record.toString());
    if (storage.hours.length == 0) {
        RecordModel.findOneAndRemove(condition, function (err, record) {
            if (!err) {
                log.info('record was removed');
                res.send('record was removed');
            } else {
                console.log(err);
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('delete');
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    } else {
        RecordModel.update(condition, record, {upsert: true}, function (err) {
            if (!err) {
                log.info(record.date + ' was saved');
                res.send(record.hours);
            } else {
                console.log(err);
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('update');
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    }
});

app.post('/saverule', function(req, res) {
    var storage = JSON.parse(req.body.storage);
    log.info(req.body.storage);
    var record = {
        room: storage.room,
        date: storage.date,
        hours: storage.hours
    };
    var condition = {
        room: storage.room,
        date: storage.date
    };
    log.info(record.toString());
    if (storage.hours.length == 0) {
        RecordModel.findOneAndRemove(condition, function (err, record) {
            if (!err) {
                log.info(record.date + ' was removed');
                res.send(record.hours);
            } else {
                console.log(err);
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('delete');
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    } else {
        RecordModel.update(condition, record, {upsert: true}, function (err) {
            if (!err) {
                log.info(record.date + ' was saved');
                res.send(record.hours);
            } else {
                console.log(err);
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('update');
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    }
});

app.get('/rooms', function(req, res) {
    log.info(config.get('rooms') + '3');
    return res.send(config.get('rooms'));

});

app.listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});