/**
 * Created by i on 28.11.13.
 */
function WeekHours() {
    var elem;
    var days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    function render() {
        elem = $('<div class="weekhours">');
        var table = ['<table class="striped-table"><caption></caption><tr><th class="day-names"></th><th>8:00</th>' +
            '<th>9:00</th><th>10:00</th><th>11:00</th><th>12:00</th><th>13:00</th><th>14:00</th><th>15:00</th>' +
            '<th>16:00</th><th>17:00</th><th>18:00</th><th>19:00</th></tr>'];

        for (var i = 0; i < days.length; i++){
            for (var j = 0; j < 12; j++){

                if( j == 0 ) {
                    table.push('<tr><td class="day-names">' + days[i] + '</td>');
                }
                table.push('<td></td>');

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