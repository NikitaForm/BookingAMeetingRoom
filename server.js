var express         = require('express');
var path            = require('path');
var config          = require('./libs/config');
var log             = require('./libs/log')(module);
var StorageModel    = require('./libs/mongoose').StorageModel;
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

app.get('/recieve', function(req, res) {
    return StorageModel.findOne({storage: "Storage"}, function (err, storage) {
        if (!err) {
            log.info(storage);
            return res.send(storage);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/save', function(req, res) {
    var storage = new StorageModel({
        storage: req.body.storage
    });

    storage.save(function (err) {
        if (!err) {
            log.info(storage.storage + '1');
            return res.send(storage.storage);
        } else {
            console.log(err);
            if(err.name == 'ValidationError') {
                res.statusCode = 400;
                res.send({ error: 'Validation error' });
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
            }
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });
    StorageModel.findOne({storage: "Storage"}, function (err, storage) {
        if (!err) {
            log.info(storage + '2');
            //return res.send(storage);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            //return res.send({ error: 'Server error' });
        }
    });

});
app.get('/rooms', function(req, res) {
    log.info(config.get('rooms') + '3');
    return res.send(config.get('rooms'));

});


app.get('/ErrorExample', function(req, res, next){
    next(new Error('Random error!'));
});

app.listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});