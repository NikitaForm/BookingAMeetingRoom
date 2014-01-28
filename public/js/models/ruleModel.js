var RuleModel = Backbone.Model.extend({
    defaults: {
        dateBegin: "",
        dateEnd: "",
        type: "rule",
        hours: [],
        room: "",
        userName: ""
    },

    url: '/rule'
});
