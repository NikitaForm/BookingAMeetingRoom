/**
 * Created by i on 23.11.13.
 */
function Calendar(date) {
    var self = this;
    var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь',
        'Ноябрь', 'Декабрь'];
    var elem, year, month, day;
    var showYear, showMonth;

    parseValue(date);

    this.getElement = function() {
        if (!elem) {
            render();
        }
        return elem;
    };

    this.getValue = function() {
        return new Date(year, month, day);
    };

    function parseValue(value) {
        if (value instanceof Date) {
            year = value.getFullYear();
            month = value.getMonth();
            day = value.getDate();
        }
    }

    this.setValue = function(newValue, quiet) {
        parseValue(newValue);

        if(elem) {
            clearSelected();
            render();
        }

        if (!quiet) $(self).triggerHandler({
            type: "select",
            value: ((day < 10) ? '0' + day : day) + '.' + ((month < 9) ? '0' + (month + 1) : (month + 1)) + '.' + year
        });
    };

    function render() {
        if (!elem) {
            elem = $('<div class="calendar"/>')
                .on('click', '.date-cell', onDateCellClick);
        }

        if (showYear != year || showMonth != month) {
            elem.html(($('<div class="currentMonth"/>').html(renderCalendarTable(new Date(year, month)))));
            elem.append($('<div class="nearbyMonth"/>').html(renderCalendarTable(new Date(year, month + 1), 1)));
            elem.prepend($('<div class="nearbyMonth"/>').html(renderCalendarTable(new Date(year, month - 1), 1)));
            showYear = year;
            showMonth = month;
        }

        if (day) {
            var num = getCellByDate(new Date(year, month, day));
            elem.find('.currentMonth td').eq(num).addClass("selected");
        }
    }

    function onDateCellClick(e) {
        day = $(e.target).html();
        self.setValue(new Date(year, month, day));
    }

    function getCellByDate(date) {
        var dateDayOne = new Date(date.getFullYear(), date.getMonth(), 1);
        return getDay(dateDayOne) + date.getDate()-1;
    }

    function clearSelected() {
        elem.find('.selected').removeClass("selected");
    }

    function getDay(date) {
        var day = date.getDay();
        if (day == 0) day = 7;
        return day - 1;
    }

    function renderCalendarTable(d, isSimple) {
        var month = d.getMonth();
        var table = ['<table class="table table-striped table-bordered table-condensed"><caption>' + monthNames[month] + ' ' + year +
            '</caption><tr><th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th><th>Пт</th><th>Сб</th>' +
            '<th>Вс</th></tr><tr>'];
        for (var i = 0; i < getDay(d); i++){
            table.push('<td></td>');
        }

        while (d.getMonth() == month) {
            if (isSimple) {
                table.push('<td>' + d.getDate() + '</td>');
            } else {
                table.push('<td class="date-cell">' + d.getDate() + '</td>');
            }

            if (getDay(d) % 7 == 6) {
                table.push('</tr><tr>');
            }
            d.setDate(d.getDate() + 1);
        }

        if(getDay(d) != 0) {
            for (i = getDay(d); i < 7; i++) {
                table.push('<td></td>');
            }
        }

        table.push('</tr></table>');
        return table.join('\n');

    }

    this.nextMonth = function() {
        self.setValue(new Date(year, month + 1));
    };

    this.previousMonth = function() {
        self.setValue(new Date(year, month - 1));
    }
}