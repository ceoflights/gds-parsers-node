"use strict";

const root = require('app-root-path');
const helpers = require(`${root}/src/helpers`);

class ServiceInfoParserDataWriter {
    _segments = [];
    _currentSegment = null;
    _currentLeg = null;

    _finalizeSegment() {
        if (this._currentSegment) {
            this._finalizeLeg();
            this._segments.push(this._currentSegment);
            this._currentSegment = null;
        }
    }

    _startNewSegment(data) {
        this._finalizeSegment();
        this._currentSegment = {
            segmentNumber: data.segmentNumber,
            airline: data.airline,
            flightNumber: data.flightNumber,
            bookingClass: data.bookingClass,

            departureTerminal: null,
            arrivalTerminal: null,
            operatedByText: '',
            miscInfoLines: [],
            legs: [],
        };
    }

    _finalizeLeg() {
        if (this._currentLeg) {
            this._currentSegment.legs.push(this._currentLeg);
            this._currentLeg = null;
        }
    }

    _startNewLeg(data) {
        this._finalizeLeg();
        this._currentLeg = {
            departureAirport: data.departureAirport,
            destinationAirport: data.destinationAirport,
            aircraft: data.aircraft,
            mealOptions: data.mealOptions,
            mealOptionsParsed: data.mealOptionsParsed,
            flightDuration: data.flightDuration,
            inFlightServicesLines: [],
        };
    }

    segmentStartLineFound(data) {
        if (!helpers.orDef(data.isHiddenSegment, false)) {
            this._startNewSegment(data);
        }
        this._startNewLeg(data);
    }

    operatedByLineFound(data) {
        this._currentSegment.operatedByText = data.text;
    }

    airportTerminalInfoLineFound(data) {
        this._currentSegment.departureTerminal = data.departureTerminal;
        this._currentSegment.arrivalTerminal = data.arrivalTerminal;
    }

    inFlightServicesLineFound(data) {
        this._currentLeg.inFlightServicesLines.push(data.text);

    }

    miscInfoLineFound(data) {
        this._currentSegment.miscInfoLines.push(data.text);
    }

    planeChangeLineFound(data) {
        this._currentSegment.hasPlaneChange = data.hasPlaneChange || helpers.orDef(this._currentSegment.hasPlaneChange, false);
    }

    getData() {
        this._finalizeSegment();

        return this._segments;
    }


}

class ServiceInfoParser {
    static parse(dump) {
        const lines = helpers.splitToLines(dump);
        const writer = new ServiceInfoParserDataWriter();
        const self = this;

        lines.forEach((line) => {
            let result = false;
            if (result = self.parseSegmentStartLine(line)) {
                writer.segmentStartLineFound(result);
            } else if (result = self.parseOperatedByLine(line)) {
                writer.operatedByLineFound(result);
            } else if (result = self.parseAirportTerminalInfoLine(line)) {
                writer.airportTerminalInfoLineFound(result);
            } else if (result = self.parseInFlightServicesLine(line)) {
                writer.inFlightServicesLineFound(result);
            } else if (result = self.parsePlaneChangeLine(line)) {
                writer.planeChangeLineFound(result);
            } else if (result = self.parseMiscInfoLine(line)) {
                writer.miscInfoLineFound(result);
            } else {
                // we allow lines that we "don't understand"
            }
        });

        return {segments: writer.getData()};
    }

    static parsePlaneChangeLine(line) {
        if (/^\s{11}PLANE\sCHANGE\sAT\s[A-Z]{3}.*/.test(line)) {
            return {hasPlaneChange: true};
        } else if (/^\s{11}PLANE\sCHANGE\s[A-Z]{3}-[A-Z]{3}.*/.test(line)) {
            return {hasPlaneChange: true};
        } else {
            return false;
        }
    }

    static parseMealOptions(line) {
        const mapping = {
            'MEAL': 'MEAL_MEAL',
            'LUNCH': 'MEAL_LUNCH',
            'SNACK': 'MEAL_SNACK',
            'DINNER': 'MEAL_DINNER',
            'HOT MEAL': 'MEAL_HOT_MEAL',
            'COLD MEAL': 'MEAL_COLD_MEAL',
            'BREAKFAST': 'MEAL_BREAKFAST',
            'NO MEAL SVC': 'MEAL_NO_MEAL_SVC',
            'MEAL AT COST': 'MEAL_MEAL_AT_COST',
            'REFRESHMENTS': 'MEAL_REFRESHMENTS',
            'CONT. BREAKFAST': 'MEAL_CONTINENTAL_BREAKFAST',
            'ALCOHOL NO COST': 'MEAL_ALCOHOL_NO_COST',
            'REFRESH AT COST': 'MEAL_REFRESH_AT_COST',
            'FOOD TO PURCHASE': 'MEAL_FOOD_TO_PURCHASE',
            'ALCOHOL PURCHASE': 'MEAL_ALCOHOL_PURCHASE',
        };

        const parsed = [];

        line.split('/').forEach((x) => {
            if (mapping.hasOwnProperty(x)) {
                parsed.push(mapping[x]);
            }
        });

        return parsed;
    }

    static parseSegmentStartLine(line) {
        const self = this;

        if (/^[\s\d]{1}[\d]{1}/.test(line) || /^[\s]{14}[A-Z]{6}/.test(line)) {
            //              ' 1 DL 2464  V TPAJFK  717  REFRESH AT COST                 2:44'
            const pattern = 'NN AAFFFFF  B DDDSSS CCCC  MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMTTTTTT';

            const mapping = {
                'N': 'segmentNumber',
                'A': 'airline',
                'F': 'flightNumber',
                'B': 'bookingClass',
                'D': 'departureAirport',
                'S': 'destinationAirport',
                'C': 'aircraft',
                'M': 'mealOptions',
                'T': 'flightDuration',
            };

            const result = helpers.splitByPosition(line, pattern, mapping, true);
            result.flightDuration = self.postprocessTime(result.flightDuration);
            result.mealOptionsParsed = self.parseMealOptions(result.mealOptions);

            const segmentNumber = parseInt(result.segmentNumber);
            result.isHiddenSegment = !segmentNumber;

            if (segmentNumber) {
                result.segmentNumber = segmentNumber;
            }

            return result;
        } else {
            return false;
        }
    }

    static isHiddenStopLine(line) {
        return /^[\s]{14}[A-Z]{6}/.test(line);
    }

    static parseOperatedByLine(line) {
        if (/^[\s]{11}OPERATED\sBY\s/.test(line)) {
            return {text: line.trim()};
        } else {
            return false;
        }
    }

    static parseAirportTerminalInfoLine(line) {
        //              '           DEPARTS JFK TERMINAL 4  - ARRIVES MNL TERMINAL 3    '
        const pattern = '           DDDDDDD EEE TTTTTTTT NN   AAAAAAA BBB SSSSSSSS MM';

        const mapping = {
            'D': 'departsToken',
            'E': 'departureAirport',
            'N': 'departureTerminal',

            'A': 'arrivesToken',
            'B': 'arrivalAirport',
            'M': 'arrivalTerminal',
        };

        const parsed = helpers.splitByPosition(line, pattern, mapping, true);

        if (parsed.departsToken === 'DEPARTS' || parsed.arrivesToken === 'ARRIVES') {
            return {
                departureAirport: parsed.departureAirport,
                departureTerminal: parsed.departureTerminal,

                arrivalAirport: parsed.arrivalAirport,
                arrivalTerminal: parsed.arrivalTerminal,
            }
        } else {
            return false;
        }
    }

    static parseInFlightServicesLine(line) {
        if (/^[\s]{22}.*$/.test(line) && line.trim().length > 0) {
            return {text: line.trim()};
        } else {
            return false;
        }
    }

    static parseMiscInfoLine(line) {
        if (/^[\s]{11}.*$/.test(line) && line.trim().length > 0) {
            return {text: line.trim()}
        } else {
            return false;
        }
    }

    static postprocessTime(time) {
        if (/^:/.test(time)) {
            time = '0' + time;
        }

        return time;
    }
}

exports.ServiceInfoParser = ServiceInfoParser;