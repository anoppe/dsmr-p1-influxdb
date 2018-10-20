'use strict';

const Influx = require('influx');
const SerialPort = require('serialport');

var supportedDSMRCodes = {
    '1-0:1.8.1': {'name' : 'consumedElectricityTariff1', 'description': 'Meter Reading electricity delivered to client (Tariff 1) in kWh'},
    '1-0:1.8.2': {'name' : 'consumedElectricityTariff2', 'description': 'Meter Reading electricity delivered to client (Tariff 2) in kWh'},
    '1-0:2.8.1': {'name' : 'producedElectricityTariff1', 'description': 'Meter Reading electricity delivered by dient (Tariff 1) in kWh'},
    '1-0:2.8.2': {'name' : 'producedElectricityTariff2', 'description': 'Meter Reading electricity delivered by client (Tariff 2) in kWh'},
    '0-0:96.14.0': {'name' : 'activeTariff', 'description': 'Tariff indicator electricity'},
    '1-0:1.7.0': {'name' : 'currentElectricityConsumption', 'description': 'Actual electricity power delivered (+P) in kW'},
    '1-0:2.7.0': {'name' : 'currentElectricityProduction', 'description': 'Actual electricity power received (-P) in kW'},
    '0-0:17.0.0': {'name' : 'currentElectricityThreshold', 'description': 'The actual threshold electricity in kW'},
    '0-0:96.3.10': {'name' : 'switchPositionElectricity', 'description': 'Switch position electricity'},
    '0-0:96.7.21': {'name' : 'anyPhasePowerFailuresCount', 'description': 'Number of power failures in any phase'},
    '0-0:96.7.9': {'name' : 'anyPhaseLongPowerFailuresCount', 'description': 'Number of long power failures in any phase'},
    '1-0:32.7.0': {'name' : 'currentVoltageLevel', 'description': 'Instantaneous voltage L1 in V'},
    '1-0:32.32.0': {'name' : 'phaseL1VoltageSagsCount', 'description': 'Number of voltage sags in phase L1'},
    '1-0:52.32.0': {'name' : 'phaseL2VoltageSagsCount', 'description': 'Number of voltage sags in phase L2'},
    '1-0:72:32.0': {'name' : 'phaseL3VoltageSagsCount', 'description': 'Number of voltage sags in phase L3'},
    '1-0:32.36.0': {'name' : 'phaseL1VoltageSwellsCount', 'description': 'Number of voltage swells in phase L1'},
    '1-0:52.36.0': {'name' : 'phaseL2VoltageSWellsCount', 'description': 'Number of voltage swells in phase L2'},
    '1-0:72.36.0': {'name' : 'phaseL3VoltageSagsCount', 'description': 'Number of voltage swells in phase L3'},
    '1-0:31.7.0': {'name' : 'currentDeliveredAmpsL1', 'description': 'Instantaneous current L1 in A'},
    '1-0:51.7.0': {'name' : 'currentDeliveredAmpsL2', 'description': 'Instantaneous current L2 in A'},
    '1-0:71.7.0': {'name' : 'currentDeliveredAmpsL3', 'description': 'Instantaneous current L3 in A'},
    // '1-0:21.7.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Instantaneous active power L1 (+P) in kW'},
    // '1-0:41.7.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Instantaneous active power L2 (+P) in kW'},
    // '1-0:61.7.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Instantaneous active power L3 (+P) in kW'},
    // '1-0:22.7.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Instantaneous active power L1 (-P) in kW'},
    // '1-0:42.7.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Instantaneous active power L2 (-P) in kW'},
    // '1-0:62.7.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Instantaneous active power L3 (-P) in kW'},
    '1-0:99.97.0': {'name' : 'deliveredElectricityTariff2', 'description': 'Power Failure Event Log'},
    '0-1:24.2.1': {'name' : 'totalConsumedGas', 'description': 'Last 5-minute Meter reading and capture time'},
    '1-3:0.2.8': {'name' : 'dsmrVersion', 'description': 'Current DMSR version'},
    '0-0:1.0.0': {'name' : 'messageTimestamp', 'description': 'Timestamp of current sample'},
    '0-1:24.1.0': {'name' : 'gasDeviceType', 'description': 'Device type of connected gas device'}
};


var influx = new Influx.InfluxDB({
    host: '<host>',
    port: 8086,
    database: '<database>'
});


/*
/ISK5\2M550E-1011
1-3:0.2.8(50)
0-0:1.0.0(181019155424S)
0-0:96.1.1(4530303333303036373737313036393136)
1-0:1.8.1(002343.524*kWh)
1-0:1.8.2(003139.303*kWh)
1-0:2.8.1(000000.000*kWh)
1-0:2.8.2(000000.000*kWh)
0-0:96.14.0(0002)
1-0:1.7.0(00.232*kW)
1-0:2.7.0(00.000*kW)
0-0:96.7.21(00008)
0-0:96.7.9(00003)
1-0:99.97.0(1)(0-0:96.7.19)(180613074327S)(0000000518*s)
1-0:32.32.0(00004)
1-0:32.36.0(00001)
0-0:96.13.0()
1-0:32.7.0(230.9*V)
1-0:31.7.0(001*A)
1-0:21.7.0(00.235*kW)
1-0:22.7.0(00.000*kW)
0-1:24.1.0(003)
0-1:96.1.0(4730303332353635353035363630313136)
0-1:24.2.1(181019155007S)(01519.357*m3)
!DA20
 */

const port = new SerialPort('/dev/ttyUSB0', {
    baudRate: 115200
}, function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }
});



port.on('open', function() {

    var buffer = '';

    port.on('data', function (data) {
        buffer += data.toString();

        var telegramStart = buffer.indexOf('/');
        var telegramEnd = buffer.indexOf('!');

        if (telegramStart >= 0 && telegramEnd >= 0) {

            var telegram = buffer.substr(telegramStart, telegramEnd);
            // console.log(telegram);
            // we received a complete telegram
            var measurement = convertToMeasurement(telegram);
            try {
                influx.writePoints([measurement]);
            } catch (err) {
                console.error("Something went wrong writing to influxdb", e);
            }

            buffer = '';
        }
    });

});

function convertToMeasurement(data) {

    var telegramLines = data.split(/\r\n|\n|\r/);

    var fields = {};
    // skip the first and last line
    for (var i = 1; i < telegramLines.length; i++) {
        var line = telegramLines[i];
        var result = _parseLine(line);

        // var valueRegex = /.*?\((.*?)\)/;
        var obisCode = result.full_code;

        if (typeof(supportedDSMRCodes[obisCode]) === 'undefined') {
            // console.log("unsupported OBIS: " + obisCode);
            continue;
        }

        var fieldName = supportedDSMRCodes[obisCode].name;
        fields[fieldName] = parseFloat(result.value);
    }

    return {
        measurement: 'p1-readings',
        fields : fields
    };
}

function _parseLine(line) {
    var result = {
        full_code: null,
        code: null,
        values: null
    };
    var matches = line.match(/^([0-9\-:\.]*)(\(.*\))$/);

    if (matches != null) {
        var value = matches[2].substr(1, matches[2].length - 2).split(')(');

        result.full_code = matches[1];
        result.code = matches[1].split(':')[1];

        if (value == null) {
            return result;
        }

        var rawValue = value;
        if (Array.isArray(value)) {
            if (value.length === 1) {
                rawValue = value[0];
            } else {
                rawValue = value[value.length -1];
            }
        }

        result.value = rawValue.split('*')[0];
    }

    return result;
}
