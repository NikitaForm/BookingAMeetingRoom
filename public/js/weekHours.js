/**
 * Created by i on 28.11.13.
 */
function WeekHours() {
    var elem;
    var self = this;
    var days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    var hours = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    function render() {
        elem = $('<div class="weekhours">');
        var table = ['<table class="striped-table table-bordered"><caption></caption><tr><th class="day-names"></th><th>8:00</th>' +
            '<th>9:00</th><th>10:00</th><th>11:00</th><th>12:00</th><th>13:00</th><th>14:00</th><th>15:00</th>' +
            '<th>16:00</th><th>17:00</th><th>18:00</th><th>19:00</th></tr>'];

        for (var i = 0; i < days.length; i++){
            for (var j = 0; j < 12; j++){

                if( j == 0 ) {
                    table.push('<tr><td class="day-names">' + days[i] + '</td>');
                }
                table.push('<td class="simple">' + i + '_' + hours[j] + '</td>');

                if( j == 11) {
                    table.push('</tr>');
                }
            }
        }
        table.push('</table>');
        elem.html(table.join('\n'));
    }



    this.getElement = function() {
        if(!elem) {
            render();
        }
        return elem;
    };
}