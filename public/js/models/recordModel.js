var RecordModel = Backbone.Model.extend({
    defaults: {
        userName: "",
        date: "",
        type: "",
        hours: "",
        room: ""
    },

    validate: function(attrs, options) {
        var arr = attrs.date.split('.');
        var date = new Date(arr[2], +arr[1] - 1, arr[0]);
        if( date < new Date().setHours(0, 0, 0, 0) ) {
            return "На выбранную дату резервирование невозможно";
        }
    },

    url: '/record'
});

var RecordList = Backbone.Collection.extend({
    model: RecordModel,
    url: '/record',
    comparator: function(record) {
        var hours = record.get('hours');
        return record.get('date') + ((hours.length < 5) ? ('0' + hours) : hours);
    }
});