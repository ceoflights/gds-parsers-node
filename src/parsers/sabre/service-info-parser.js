"use strict";

const helpers = require(`../../helpers`);

function _extractSegmentData(firstLeg) {
    const segment = {
        segmentNumber: firstLeg.segmentNumber,
        airline: firstLeg.airline,
        flightNumber: firstLeg.flightNumber,
    }

    delete firstLeg.segmentNumber;
    delete firstLeg.airline;
    delete firstLeg.flightNumber;

    return [segment, firstLeg];
}

function _calculateHasPlaneChange(segment) {
    return segment.legs.map(x => x.aircraft).filter(x => x).filter((v, i, a) => a.indexOf(v) === i).length > 1; 
}

class ServiceInfoParserDataWriter {
    _segments = [];
    _currentSegment = null;
    _currentLeg = null;



    _flushLeg() {
        if (this._currentLeg) {
            this._currentSegment.legs = helpers.orDef(this._currentLeg.legs, []);
            this._currentSegment.legs.push(this._currentLeg);
        }
    }

    _flushSegment(initialData) {
        const self = this;
        this._flushLeg();
        if (this._currentSegment) {
            this._currentSegment.hasPlaneChange = _calculateHasPlaneChange(this._currentSegment);

            this._segments.push(this._currentSegment);
        }
        this._currentSegment = initialData;
    }

    legFound(data) {
        const self = this;
        if (data.segmentNumber) {
            const tokens = _extractSegmentData(data);
            this._flushSegment(tokens.shift());
            this._currentLeg = tokens.shift();
        } else {
            this._flushLeg();
            this._currentLeg = data;
        }
        this._currentLeg.departureTerminal = null;
        this._currentLeg.destinationTerminal = null;
    }

    terminalsFound(data) {
        this._currentLeg.departureTerminal = data.departureTerminal;
        this._currentLeg.destinationTerminal = data.destinationTerminal;
    }

    getData() {
        this._flushSegment();

        return {
            segments: this._segments,
        };
    }
}

class ServiceInfoParser {

    //'   FLIGHT  DATE  SEGMENT DPTR  ARVL    MLS  EQP  ELPD MILES SM'
    //'   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMD'
    //'   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMK'
    //'1N   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMD'
    static isValidHeader(line) {
        return /FLIGHT.*DATE.*SEGMENT.*DPTR.*ARVL.*EQP.*ELPD/.test(line);
    }

    static parseTerminalLine(line) {
        line = line.trim();

        let tokens = null;
        const self = this;
        let matches = null;

        if (matches = line.match(/^(DEP-.+?)?(ARR-.+)?$/)) {
            tokens = {
                departureTerminal: helpers.orDef(matches[1], '').substr(4),
                destinationTerminal: helpers.orDef(matches[2], '').substr(4),
            }
        }

        if (tokens) {
            const departureTerminal = helpers.orDef(tokens.departureTerminal, '').trim();
            const destinationTerminal = helpers.orDef(tokens.destinationTerminal, '').trim();

            return {
                departureTerminal: {
                    raw: departureTerminal,
                    parsed: self.parseTerminalNumber(departureTerminal),
                },
                destinationTerminal: {
                    raw: destinationTerminal,
                    parsed: self.parseTerminalNumber(destinationTerminal),
                }
            }
        } else {
            return false;
        }
    }

    static parseTerminalNumber(token) {
        token = token.trim();
        let parsed = null;

        if (parsed = token.match(/^TERMINAL ([A-Z0-9]{1,2})$/)) {
            return parsed[1];
        } else if (parsed = token.match(/^INTERNATIONAL ([A-Z0-9]{1,2})$/)) {
            return parsed[1];
        } else {
            return null;
        }
    }

    static parse(dump) {
        const self = this;
        const result = new ServiceInfoParserDataWriter();
        const lines = helpers.splitToLines(dump).filter((x) => x);
        const firstLine = lines.shift();
        const isValidHeader = self.isValidHeader(firstLine);

        if (!isValidHeader) {
            return null;
        }

        lines.forEach((line) => {
            let res = null;

            if (res = self.parseTerminalLine(line)) {
                result.terminalsFound(res);
            } else if (res = self.parseSegmentLine(line)) {
                result.legFound(res);
            }
        });

        return result.getData();
    }

    static parseSegmentLine(line) {
        const self = this;
        //              '   FLIGHT  DATE  SEGMENT DPTR  ARVL    MLS  EQP  ELPD MILES SM ',
        //              '   FLIGHT  DATE  SEGMENT DPTR  ARVL   MLS   EQP  ELPD MILES SMD',
        //              ' 1 PR  127 24NOV JFK YVR 1155P  310A¥1 D    773  6.15  2424  N '
        //              '                 YVR JFK  200P 1010P   H         5.10  2424  N ',
        //              ' 1 AA*4030 13NOV BWI PHL  420P  509P        CRJ   .49    91  N ',
        const pattern = 'LL AA_FFFF DDDDD PPP SSS TTTTT QQQQQXX MMM  EEE OOOOO IIIII NN';

        const mapping = {
            ' ': 'whitespace',
            'L': 'segmentNumber',
            'A': 'airline',
            'F': 'flightNumber',
            'D': 'departureDate',
            'P': 'departureAirport',
            'S': 'destinationAirport',
            'T': 'departureTime',
            'Q': 'destinationTime',
            'X': 'offset',
            'M': 'meals',
            'E': 'aircraft',
            'O': 'flightDuration',
            'I': 'miles',
            'N': 'smoking',
        };

        const tokens = helpers.splitByPosition(line, pattern, mapping, true);

        if (
            tokens.whitespace === '' && 
            /^[A-Z]{3}$/.test(tokens.departureAirport) && 
            /^[A-Z]{3}$/.test(tokens.destinationAirport) **
            /^\d*\.\d{2}$/.test(tokens.flightDuration)
        ) {
            return {
                segmentNumber: tokens.segmentNumber,
                airline: tokens.airline,
                flightNumber: tokens.flightNumber,
                departureDate: self.parseDate(tokens.departureDate),
                departureAirport: tokens.departureAirport,
                destinationAirport: tokens.destinationAirport,
                departureTime: self.parseTime(tokens.departureTime),
                destinationTime: self.parseTime(tokens.destinationTime),
                offset: self.parseDayOffset(tokens.offset),
                meals: self.parseMeals(tokens.meals),
                smoking: tokens.smoking === 'Y',
                aircraft: tokens.aircraft,
                flightDuration: self.parseDuration(tokens.flightDuration),
                miles: tokens.miles,
            };
        } else {
            return null;
        }
    }

    static parseDate(token) {
        const parsed = token ? helpers.parseGdsPartialDate(token) : null;

        return parsed ? {raw: token, parsed: parsed.month.toString() + "-" + parsed.day.toString()} : null;
    }

    static parseTime(token) {
        const parsed = token ? helpers.parseGdsTime(token) : null;

        return parsed ? {raw: token, parsed: parsed} : null;
    }

    static parseDuration(duration) {
        if (duration) {
            duration = duration.padStart(5, '0');
            return duration.replace('.', ':');
        } else {
            return null;
        }
    }

    static parseDayOffset(token) {
        token = token.replace('¥', '+');

        if (token == '') {
            return 0;
        } else if (token == '|' || token == '+') {
            return 1;
        } else if (token == '-') {
            return -1;
        } else if (parseInt(token)) {
            return parseInt(token);
        } else {
            return null;
        }
    }

    static parseMeals(token) {
        const mapping = {
            'M': 'MEAL_MEAL',
            'L': 'MEAL_LUNCH',
            'S': 'MEAL_SNACK',
            'D': 'MEAL_DINNER',
            'H': 'MEAL_HOT_MEAL',
            'O': 'MEAL_COLD_MEAL',
            'B': 'MEAL_BREAKFAST',
            'N': 'MEAL_NO_MEAL_SVC',
            'R': 'MEAL_REFRESHMENTS',
            'C': 'MEAL_ALCOHOL_NO_COST',
            'V': 'MEAL_REFRESH_AT_COST',
            'F': 'MEAL_FOOD_TO_PURCHASE',
            'P': 'MEAL_ALCOHOL_PURCHASE',
            'K': 'MEAL_CONTINENTAL_BREAKFAST',
            'G': 'MEAL_FOOD_AND_ALCOHOL_AT_COST',
        };

        const chars = token.split("");
        const result = [];

        chars.forEach((c) => {
            const meal = helpers.orDef(mapping[c], null);

            if (meal) {
                result.push(meal);
            }
        });

        return {
            raw: token,
            parsed: result,
        };
    }
}

exports.ServiceInfoParser = ServiceInfoParser;