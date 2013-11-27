/**
 * Created by i on 23.11.13.
 */
function Calendar(date) {
    var self = this;
    var monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь',
        'Ноябрь', 'Декабрь'];
    var elem, year, month, day;
    var showYear, showMonth;

    parseValue (date);

    this.getElement = function() {
        if (!elem) {
            render();
        }
        return elem;
    };

    this.getValue = function() {
        return new Date(year, month);
    };
    function parseValue (value, isDayDefined) {
        if (value instanceof Date) {
            year = value.getFullYear();
            month = value.getMonth();
            if(isDayDefined) {
                day = value.getDate();
            }

        }
   /*         day = value.getDate();
        } else {
            year = value.year;
            month = value.month;
            day = value.day;
        }
        alert(month);
    */
    }

    this.setValue = function(newValue, isDayDefined, quiet) {
        parseValue(newValue, isDayDefined);

        if(elem) {
            clearSelected();
            render();
        }

        if(!quiet) {
            $(self).triggerHandler({
                type: "select",
         //       value: (new Date(year, month, day))
                value: '' + ((day < 10) ? '0' + day : day) + '.' + ((month < 10) ? '0' + month : month) + '.' + year
            });
        }
    };

    function render() {
        if (!elem) {
            elem = $('<div class="calendar"/>')
                .on('click', '.date-cell', onDateCellClick);
        }

        if (showYear != year || showMonth != month) {
            elem.html(renderCalendarTable(year, month));
            elem.find('caption').html(monthNames[month] + ' ' + year);
            showYear = year;
            showMonth = month;
        }

        if (day) {
            var num = getCellByDate(new Date(year, month, day));
            elem.find('td').eq(num).addClass("selected");
        }
    }

    function onDateCellClick(e) {
        day = $(e.target).html();
        self.setValue({year: year, month: month, day: day});
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

    function renderCalendarTable(year, month) {
        var d = new Date(year, month);
        var table = ['<table class="calendar-table"><caption></caption><tr><th>Пн</th><th>Вт</th><th>Ср</th><th>Чт</th>' +
            '<th>Пт</th><th>Сб</th><th>Вс</th></tr><tr>'];
        for (var i = 0; i < getDay(d); i++){
            table.push('<td></td>');
        }

        while (d.getMonth() == month) {
            table.push('<td class="date-cell">' + d.getDate() + '</td>');

            if (getDay(d) % 7 == 6) {
                table.push('</tr><tr>');
            }
        d.setDate(d.getDate() + 1);
        }

        if(getDay(d) != 0) {
            for (var i = getDay(d); i < 7; i++) {
                table.push('<td></td>');
            }
        }

        table.push('</tr></table>');
        return table.join('\n');

    }

    this.monthForward = function() {
        this.setValue(new Date(year, month + 1), 0, 1);
    };

    this.monthBack = function() {
        this.setValue(new Date(year, month - 1), 0, 1);
    }

}