var RuleView = Backbone.View.extend({
    el: ('#tab2'),

    events: {
        'click .simple': 'creDel',
        'click #createRule': 'createRule'
    },

    initialize: function() {
        this.listenTo(stateModel, 'change:currentRoom', this.syncIt);
        this.listenTo(this.model, 'change', this.update);
        this.listenTo(this.model, 'init', this.render);
    },

    update: function() {
        $('.simple').toggleClass('user-reserved', false);
        var arr = this.model.get('hours');
        $('.simple').each(function(index, elem) {
            if ( arr.indexOf($(elem).html()) != -1 ) {
                $(elem).toggleClass('user-reserved');
            }
        });
    },

    render: function() {
        $('#dateBegin').val(this.model.get('dateBegin'));
        $('#dateEnd').val(this.model.get('dateEnd'));
    },

    creDel: function(e) {
        var obj = $(e.target).html();
        var arr = this.model.get('hours');
        var res = [];
        if (arr.indexOf(obj) == -1) {

            res = _.union(arr, [obj]);
        } else {
            res = _.without(arr, obj);
        }
        this.model.set({
            'hours': res
        });
    },

    createRule: function() {
        this.model.set({
            dateBegin: $('#dateBegin').val(),
            dateEnd: $('#dateEnd').val(),
            room: stateModel.get('currentRoom'),
            userName: stateModel.get('currentUser')
        });
        var days = getDaysByRule(this.model);
        var RuleList = Backbone.Collection.extend({
            model: RecordModel,
            url: '/recordsByRule'
        });
        var coll = new RuleList();
        coll.add(days);
        coll.sync('create', coll, {
            success: function(coll, response) {
                $('#up').click();
                ruleModel.sync('create', ruleModel, {
                    success: function(model, response) {
                        console.log('rule synced');
                    },
                    error: function(model, response) {
                        alert('There are some troubles with creating');
                    }
                });
            },
            error: function(coll, response) {
                alert('There are some troubles with creating');
            }
        });
        function getDaysByRule(rule) {
            var begin = rule.get('dateBegin').split('.');
            var end = rule.get('dateEnd').split('.');
            var dateBegin = new Date(begin[2], +begin[1] - 1, begin[0]);
            var dateEnd = new Date(end[2], +end[1] - 1, end[0]);
            var recordList = [];
            var res = _.groupBy(rule.get('hours'), function(str){ return +str.charAt(0); });

            if (res) {
                while (+dateBegin <= +dateEnd) {
                    var arr = res[(dateBegin.getDay() + 6 )%7];
                    if (arr){
                        for(var i = 0; i < arr.length; i++) {
                            (function(hour) {
                                var record = {};
                                record.date = convertToString(dateBegin);
                                record.userName = stateModel.get('currentUser');
                                record.room = stateModel.get('currentRoom');
                                record.type = 'rule';
                                record.hours = hour;
                                recordList.push(record);
                            })(arr[i].substr(2));
                        }
                    }
                    dateBegin.setDate(dateBegin.getDate() + 1);
                }
            }
            return recordList;
        }
    },

    syncIt: function() {
        var self = this;
        this.model.fetch(
            {data: {
                userName: stateModel.get('currentUser'),
                room: stateModel.get('currentRoom')
            },
                success: function(model, response) {
                    console.log('sync coll');
                    self.model.trigger('init');
                },
                error: function(model, response) {
                    alert('There are some troubles with fetching rule');
                },
                reset: true
            });
    }

});
