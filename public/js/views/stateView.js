var StateView = Backbone.View.extend({
    el: ('#main'),

    events: {
        "click #roomslist li": "setRoom"
    },

    templates: {

    },

    initialize: function() {
        this.templates.forDate = _.template($('#forDate').html());
        this.templates.forGreeting = _.template($('#forGreeting').html());
        $(calendar).on('select', this.setDate);
        $(calendar2).on('select', this.setDate);
        $('#weekhours-holder').prepend(weekHours.getElement());
        this.listenTo(this.model, 'change', this.render);
        $('#dateBegin , #dateEnd').attr("placeholder", "дд.мм.гггг").datepicker({
            minDate: new Date,
            maxDate: '+1y',
            dateFormat: 'dd.mm.yy',
            autoSize: true,
            firstDay: 1,
            onSelect: function(date, datepicker) {
                if (datepicker.id == 'dateBegin') {
                    $('#dateEnd').datepicker("setDate", date).datepicker("enable")
                        .datepicker("option", "minDate", date);
                }
            }
        }).filter("#dateEnd").datepicker("disable");
    },

    setDate: function(e) {
        stateModel.set({
            date: e.value
        });
    },

    setRoom: function(e) {
        stateModel.set({
            currentRoom: $(e.target).html()
        });
    },

    render: function() {
        $('#date').html(this.templates.forDate(this.model.toJSON()));
        $('#greeting').html(this.templates.forGreeting(this.model.toJSON()));
        var list = "<% _.each(rooms, function(name) { %> <li><a tabindex='-1'><%= name %></a></li> <% }); %>";
        $('#roomslist').html(_.template(list, {rooms: stateModel.get('rooms')}));
    }
});