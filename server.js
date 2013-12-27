var express         = require('express');
var path            = require('path');
var config          = require('./libs/config');
var log             = require('./libs/log')(module);
var ldap            = require('ldapjs');
var RecordModel     = require('./libs/mongoose').RecordModel;
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

app.post('/login', function (req, mainRes) {
    log.info("enter");

    var URL = 'ldap://127.0.0.1:5000';

    function myLDAPBind(user, pass, callback) {
       /* assert.equal(typeof (user), 'string');
        assert.equal(typeof (pass), 'string');
        assert.equal(typeof (callback), 'function');*/

        var client = ldap.createClient({
            url: URL
        });

        var filter = '(username=admin)';

        var opts = {
            filter: filter,
            scope: 'sub'
        };

        var entry;
        return client.search('username=admin, o=users', opts, function (err, res) {
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
                            return callback(null, mainRes, entry.toObject());
                        }

                    });
                });
            });
        });
    }
    myLDAPBind("admin", "admin", function(err, res, user) {
        if(err) {
            console.log(err + '1111');
            res.send('err');
        } else {
            console.log('user' + user.role);
            res.send(user.role);
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

app.get('/rooms', function(req, res) {
    return res.send(config.get('rooms'));
});

var port = process.env.PORT || config.get('port');
app.listen(port, function(){
    log.info('Express server listening on port ' + port);
});