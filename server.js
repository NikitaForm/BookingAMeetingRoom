var express         = require('express');
var path            = require('path');
var config          = require('./libs/config');
var log             = require('./libs/log')(module);
var ldap            = require('ldapjs');
var RecordModel     = require('./libs/mongoose').RecordModel;
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


app.get('/receive', function(req, res) {
    var date = (req.query.date).substring(3);
    var userName = req.query.userName;
    var room = decodeURIComponent(req.query.room);
    req.session.room = room;
    return RecordModel.find({'room': room,
    $or: [{'date': new RegExp(date)}, {'date': 'rule', 'userName': userName}]}, 'room date type userName hours -_id', function (err, record) {
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
    var type = req.body.type;
    var role = req.body.role;
    var userName = req.body.userName;

    if( type == 'rule' ) {
        RecordModel.remove({type: 'rule', userName: userName, room: storage[0].room}, function(err) {
            if (!err) {
                log.info('rule was cleared');
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    }
    if( type == 'manual' ) {
        RecordModel.remove({userName: userName, date: storage[0].date, room: storage[0].room}, function(err) {
            if (!err) {
                log.info('records was removed');
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    }
    for (var i = 0; i < storage.length; i++) {
        if(storage[i].hours == 0) {
            res.send('record was removed');
            continue;
        }
        var record =  new RecordModel ({
            room: storage[i].room,
            date: storage[i].date,
            hours: storage[i].hours,
            userName: storage[i].userName,
            type: type
        });
       /* var condition = {
            room: storage.room,
            date: storage.date,
            userName: storage[i].userName
        };
        if (storage.hours == 0) {
            RecordModel.findOneAndRemove(condition, function(err, record) {
                if (!err) {
                    log.info('record was removed');
                    res.send('record was removed');
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                    log.error('Internal error(%d): %s',res.statusCode,err.message);
                }
            });
        } else {*/
           // RecordModel.update(condition, record, {upsert: true}, function (err) {
        var condition = {
            room: storage[i].room,
            date: storage[i].date,
            hours: storage[i].hours
        };
        //log.info(record.date);
        (function(cond, curRecord) {RecordModel.findOne(cond,function(err, rec) {
            if (!err) {
                if ((!rec) || (cond.date == 'rule')) {
                    curRecord.save(function (err, record) {
                        if (!err) {
                            log.info(record.date + ' was saved');
                            res.send(record.hours);
                        } else {
                            res.statusCode = 500;
                            res.send({ error: 'Server error' });
                            log.error('Internal error(%d): %s',res.statusCode,err.message);
                        }
                    });
                } else {
                    if(role == 'admin'){
                        if(userName == cond.userName) {
                            RecordModel.update(cond, {userName: userName}, function(err) {
                                if (!err) {
                                    log.info(record.date + ' was saved');
                                    res.send(record.hours);
                                } else {
                                    res.statusCode = 500;
                                    res.send({ error: 'Server error' });
                                    log.error('Internal error(%d): %s',res.statusCode,err.message);
                                }
                            });
                        } else {
                            RecordModel.remove({room: curRecord.room, date: curRecord.date, hours: curRecord.hours}, function(err) {
                                if (!err) {
                                    log.info('another user records was removed');
                                    res.send('ok');
                                } else {
                                    res.statusCode = 500;
                                    res.send({ error: 'Server error' });
                                    log.error('Internal error(%d): %s',res.statusCode,err.message);
                                }
                            });
                        }

                    } else {
                        res.send('ok');
                    }
                }
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });})(condition, record);
    }
});

app.post('/login', function (mainReq, mainRes) {
    log.info("enter");
    var userName = mainReq.body.username;
    var password = mainReq.body.password;
    log.info(userName);

    var URL = 'ldap://127.0.0.1:5000';

    function myLDAPBind(user, pass, callback) {
       /* assert.equal(typeof (user), 'string');
        assert.equal(typeof (pass), 'string');
        assert.equal(typeof (callback), 'function');*/

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
                        //assert.ifError(err);
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
            console.log(err + '1111');
            res.statusCode = 403;
            res.send('err');
        } else {
            console.log('user' + user.role);
            log.info(req.session);
            if(req.session){
                req.session.userName = userName;
                req.session.userRole = user.role;
            }
            //req.session.userName = userName;
            //req.session.userRole = user.role;
            res.send({
                    userRole: user.role,
                    userName: userName,
                    room: req.session.room
                     });
        }
    });
   /* var filter = '(username=admin)';
    var opts = {
        filter: filter,
        scope: 'sub'
    };
    log.info(req.body.username);
    //if (!req.body.username.match(/^[a-zA-Z0-9\-_]{3,}$/) && !req.body.password.match(/^[a-zA-Z0-9\-_]{3,}$/)) {
       // options.error = "Utilisateur ou mot de passe incorrect";
        //res.render("login", options);
    if(false){
    } else {
        client.search('username=admin, o=users',opts, function(err, res) {

                var dn;
                res.on('searchEntry', function(entry) {
                    dn = entry.objectName;
                    console.log(dn);
                });
                res.on('error', function(err) {
                    log.error(err.message);
                });
                res.on('end', function() {
                    client.bind(dn, 'admin', function(err) {
                        console.log(err);
                        if (err) {
                            console.log('Error');
                        } else {
                            console.log('OK');
                        }
                    });
                });



        });
    }*/
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