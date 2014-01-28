
var calendar;
var calendar2;
var weekHours = new WeekHours();
var mainApp;
var stateModel;
var stateView;
var ruleModel;
var ruleView;
var mainView;

$(function() {
    mainApp = new MainApp();
    mainView = new MainAppView({ model: mainApp });
})

function nextMonth(e) {
    setTimeout(function() {
        calendar.nextMonth();
        calendar2.nextMonth();
    }, 400);
}

function prevMonth(e) {
    setTimeout(function() {
        calendar.previousMonth();
        calendar2.previousMonth();
    }, 400);
}

function convertToString(d) {
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    return (((day < 10) ? '0' + day : day) + '.' + ((month < 10) ? '0' + month : month) + '.' + year);
}










