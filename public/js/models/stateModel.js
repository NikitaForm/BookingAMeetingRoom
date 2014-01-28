var StateModel = Backbone.Model.extend({
    defaults: {
        currentUser: "",
        currentRole: "",
        currentRoom: "",
        rooms: [],
        date: ""
    }
});