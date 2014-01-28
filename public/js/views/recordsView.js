var RecordsView = Backbone.View.extend({

    el: ('#tab1'),

    events: {
        'click #schedule li': 'creDel',
        'click #right-control, #left-control': 'group',
        'click #up ': 'syncIt'
    },

    initialize: function() {
        this.template = _.template($('#first').html());
        this.coll = new RecordList();
        this.listenTo(this.coll, 'all', this.updateHours);
        this.listenTo(this.coll, 'all', this.group);
        this.listenTo(stateModel, 'change:date', this.update);
        this.listenTo(stateModel, 'change:currentRoom', this.syncIt);
    },

    render: function() {
        $(this.el).prepend(this.template());

    },

    update: function() {
        if((stateModel.previous('date')).split('.')[1] != (stateModel.get('date')).split('.')[1]) {
            this.syncIt();
        } else {
            this.updateHours();
        }
    },

    updateHours: function() {

        var lis = $('#schedule li').toggleClass('reserved', false).toggleClass('user-reserved', false);
        var sub = this.coll.where({
            date: stateModel.get('date')
        });
        var user = stateModel.get('currentUser');
        for(var i = 0; i < sub.length; i++) {
            lis.each(function(index, elem) {

                if ( sub[i].get('hours') == $(elem).html() ) {
                    $(elem).toggleClass( (sub[i].get('userName') == user) ? 'user-reserved' : 'reserved');
                }
            });
        }
    },

    group: function(e) {

        var groupForDays = this.coll.groupBy(function(obj, index) {
            return obj.get('date');
        });
        var groupForList = this.coll.where({
            userName: stateModel.get('currentUser')
        });
        groupForList = _.groupBy(groupForList, function(obj) {
            return obj.get('date');
        });
        var keys = [];
        for( var key in groupForDays) {
            keys.push(parseInt(key.split('.')[0]).toString());
        }
        var tds = $('.date-cell').toggleClass('reserved', false);
        if (keys) {
            tds.each(function(index, elem) {
                if(keys.indexOf($(elem).html()) != -1) {
                    $(elem).addClass('reserved');
                }
            });
        }

        var list = "<% var res = [] ; if (_.isEmpty(recList)) { var str = 'Пока нет резервирований';" +
            "%> <li><%= str %></li> <%" +
            "} else {for (var key in recList) { _.each(recList[key], function(rec) {" +
            "res.push(rec.get('hours'))});" +
            "%> <li><%= key + '____' + res.join(', ') %></li> <%res.length = 0; }} %>";
        $('#month-list').html(_.template(list, {recList:(groupForList)}));
    },

    creDel: function(e) {
        var obj = {
            date: stateModel.get('date'),
            room: stateModel.get('currentRoom'),
            hours: $(e.target).html()
        };
        var coll = this.coll;
        var mod = this.coll.where(obj);
        if ( mod.length == 0) {
            var model1 = new RecordModel();
            model1.set(obj, {validate: true});
            if ( !(model1.get('date')) ){
                return false;
            }
            model1.set({
                userName: stateModel.get('currentUser'),
                type: "manual"
            });
            model1.sync('create', model1, {
                success: function(model, response) {
                    coll.add(model1);
                },
                error: function(model, response) {
                    alert('There are some troubles with creating');
                }
            });
        } else {

            if ((mod[0].get('userName') == stateModel.get('currentUser')) || ((stateModel.get('currentRole') == 'admin')
                && confirm('Данное действие приведет к удалению резервирования другого пользователя. Продолжить?'))) {
                mod[0].sync('delete', mod[0], {
                    success: function(model, response) {
                        coll.remove(mod);
                    },
                    error: function(model, response) {
                        alert('There are some troubles with deleting');
                    }
                });
            }
        }
    },

    syncIt: function() {
        var self = this;
        this.coll.fetch(
            {data: {
                date: stateModel.get('date'),
                room: stateModel.get('currentRoom')
            },
                success: function(collection, response) {
                    console.log('sync coll');
                },
                error: function(collection, response) {
                    alert('There are some troubles with fetching');
                },
                reset: true
            });
    }
});