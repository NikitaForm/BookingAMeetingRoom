var express         = require('express');
var path            = require('path');
var config          = require('./libs/config');
var log             = require('./libs/log')(module);
var ldap            = require('ldapjs');
var RecordModel     = require('./libs/mongoose').RecordModel;
var RuleModel       = require('./libs/mongoose').RuleModel;
var mongoose        = require('mongoose');
var app = express();

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());



var MongoStore = require('connect-mongo')(express);

app.use(express.session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    store: new MongoStore({mongoose_connection: mongoose.connection})
}));
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


app.get('/record', function(req, res) {
    var date = (req.query.date).substring(3);
    var room = decodeURIComponent(req.query.room);
    req.session.room = room;
    return RecordModel.find({'room': room,
       'date': new RegExp(date)}, 'room date type userName hours -_id', function (err, record) {
        if (!err) {
            return res.send(JSON.stringify(record));
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/record', function(req, res) {
    var record = new RecordModel((req.body));
        record.save(function (err, record) {
            if (!err) {
                log.info(record.date + ' was saved');
                res.send(record);
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
});

app.post('/recordsByRule', function(req, res) {
    var recordList = req.body;
    RecordModel.remove({type: 'rule', userName: req.session.userName, room: req.session.room}, function(err) {
        if (!err) {
            log.info('rule was cleared');

            if(recordList.length != 0) {
                log.info('loop');
                for (var i = 0; i < recordList.length; i++){
                    var record =  new RecordModel (recordList[i]);
                    var condition = {
                        room: recordList[i].room,
                        date: recordList[i].date,
                        hours: recordList[i].hours
                    };
                    (function(cond, curRecord) {RecordModel.findOne(cond,function(err, rec) {
                        if (!err) {
                            if (rec) {
                                res.send(curRecord);
                            } else {
                                curRecord.save(function (err, record) {
                                    if (!err) {
                                        res.send([]);
                                    } else {
                                        res.statusCode = 500;
                                        res.send({ error: 'Server error' });
                                        log.error('Internal error(%d): %s',res.statusCode,err.message);
                                    }
                                });
                            }
                        } else {
                            res.statusCode = 500;
                            res.send({ error: 'Server error' });
                            log.error('Internal error(%d): %s',res.statusCode,err.message);
                        }
                    });
                    })(condition, record);
                }
            } else {
                res.send([]);
            }
        } else {
            res.statusCode = 500;
            res.send({ error: 'Server error' });
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });

});

app.delete('/record', function(req, res) {
    if ( (req.body.userName == req.session.userName) || (req.session.userRole == 'admin') ) {
        RecordModel.findOneAndRemove(req.body, function(err, record) {
            if (!err) {
                log.info('records was removed');
                res.send(record);
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    } else {
        res.send({});
    }
});

app.post('/rule', function(req, res) {
    var rule = req.body;
    var cond = {
        userName: req.body.userName,
        room: req.body.room
    };
    RuleModel.findOneAndUpdate(cond, rule, {upsert: true}, function (err, rule) {
        if (!err) {
            log.info(rule.dateBegin + ' was saved');
            res.send(rule);
        } else {
            res.statusCode = 500;
            res.send({ error: 'Server error' });
            log.error('Internal error(%d): %s',res.statusCode,err.message);
        }
    });
});

app.get('/rule', function(req, res) {
    var userName = (req.query.userName);
    var room = decodeURIComponent(req.query.room);
    return RuleModel.findOne({'room': room,
        'userName': userName}, 'room type userName hours dateBegin dateEnd -_id', function (err, rule) {
        if (!err) {
            log.info(JSON.stringify(rule) + 'rule found');
            rule = rule || {};
            return res.send(rule);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/login', function (mainReq, mainRes) {
    var userName = mainReq.body.username;
    var password = mainReq.body.password;
    var URL = 'ldap://leepy-caverns-7803.herokuapp.com';

    function myLDAPBind(user, pass, callback) {
        var client = ldap.createClient({
            url: URL
        });
        var filter = '(username=' + user +')';
        var opts = {
            filter: filter,
            scope: 'sub'
        };
        var entry;
        return client.search('username=' + user +', o=users', opts, function (err, res) {
            if (err)
                return callback(err, mainRes);
            res.on('searchEntry', function (_entry) {
                entry = _entry;
            });
            res.on('error', function (err) {
                return callback(err, mainRes);
            });
            res.on('end', function () {
                if (!entry)
                    return callback(new Error(user + ' not found'), mainRes);
                return client.bind(entry.dn.toString(), pass, function (err) {
                    if (err)
                        return callback(err, mainRes);
                    return client.unbind(function (err) {
                        if(err) {
                            console.log(err);
                        } else {
                            return callback(null, mainRes, mainReq,  entry.toObject());
                        }
                    });
                });
            });
        });
    }
    myLDAPBind(userName, password, function(err, res, req, user) {
        if(err) {
            res.statusCode = 403;
            res.send(err);
        } else {
            if(req.session){
                req.session.userName = userName;
                req.session.userRole = user.role;
            }
            res.send({
                userRole: user.role,
                userName: userName,
                room: req.session.room || config.get('rooms')[0],
                rooms: config.get('rooms')
            });
        }
    });
});

app.post('/logout', function(req, res) {
    req.session.destroy();
    res.end();
});

app.get('/rooms', function(req, res) {
    return res.send({
        rooms: config.get('rooms'),
        userName: req.session?req.session.userName:" ",
        userRole: req.session?req.session.userRole:" ",
        room: req.session?req.session.room:" "
    });
});

var port = process.env.PORT || config.get('port');
app.listen(port, function(){
    log.info('Express server listening on port ' + port);
});
