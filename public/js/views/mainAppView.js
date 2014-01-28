/**
 * Created by i on 26.01.14.
 */
var MainAppView = Backbone.View.extend({
    el: ("#main"),

    templates: {

    },

    events: {
        "click #logform button": "check",
        "click #logout": "logout"
    },

    initialize: function() {

        this.templates.start = _.template($('#start').html());
        this.templates.success = _.template($('#success').html());
        var self = this;
        function firstInitialize() {
            $.ajax({
                url:'/rooms'
                , type:'GET'
                , data:'jsonData'
                , success: function(res) {
                    if(res.rooms && res.userName && res.userRole) {
                        mainApp.set({
                            'state': 'success'
                        });
                        stateModel.set({
                            currentRole: res.userRole,
                            currentUser: res.userName,
                            rooms: res.rooms,
                            currentRoom: res.room,
                            date: convertToString(new Date())
                        });
                    } else {
                        self.render();
                    }
                }
                , error: function(res) {
                    alert('Here is some troubles with booking ');
                }
            });
        }
        this.listenTo(this.model, 'change', this.render);
        firstInitialize();
    },

    logout: function() {
        var self = this;
        function logout() {
            $.ajax({
                url:'/logout'
                , type:'POST'
                , success: function(res) {
                    stateModel = stateModel.set({
                        currentRole: '',
                        currentUser: '',
                        currentRoom: '',
                        date: convertToString(new Date()),
                        rooms: ''
                    }, {silent: true});
                    self.model.set({
                        state: 'start'
                    });
                }
                , error: function(res) {
                    alert('Here is some troubles with booking ');
                }
            });
        }
        logout();
    },

    check: function() {
        if ( !(($('#username').val()) && ($('#password').val())) ) {
            alert('Не введены логин или пароль');
        } else {
            $.ajax({
                url:'/login'
                , type:'POST'
                , data: {
                    'username': $('#username').val(),
                    'password': $('#password').val()
                }
                , success: function(res) {

                    mainApp.set({
                        'state': 'success'
                    });
                    stateModel.set({
                        currentRole: res.userRole,
                        currentUser: res.userName,
                        currentRoom: res.room,
                        date: convertToString(new Date()),
                        rooms: res.rooms
                    });
                }
                , error: function(res) {
                    alert('Логин либо пароль введены неверно');
                    mainApp.set({
                        'state': 'start'
                    });
                }
            });
        }
    },

    render: function() {
        var state = this.model.get("state");
        $(this.el).html(this.templates[state](this.model.toJSON()));

        if(state == 'success') {
            calendar = new Calendar( new Date() );
            calendar2 = new Calendar( new Date() );
            $('#carousel1').append(calendar.getElement());
            $('#carousel2').append(calendar2.getElement());
            $('#right-control').on('click', nextMonth);
            $('#left-control').on('click', prevMonth);
            $('.carousel').carousel({
                interval:false
            });

            stateModel = new StateModel();
            var recordsView = new RecordsView();
            recordsView.render();
            ruleModel = new RuleModel();
            ruleView = new RuleView({
                model: ruleModel
            });
            stateView = new StateView({
                model: stateModel
            });
        }
    }
});