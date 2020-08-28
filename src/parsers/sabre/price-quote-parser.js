"use strict";

const root = require('app-root-path');
const helpers = require(`${root}/src/helpers`);

const moment = require('moment');

class PriceQuoteParser {
    static parse(dump, baseDate) {
        const result = {itinerary: []};
        const unparsedLines = [];
        const lines = helpers.splitToLines(dump);
    
        lines.forEach(line => {
            const maybeSegment = PriceQuoteParser.parseAirSegmentLine(line, baseDate);
    
            if (maybeSegment) {
                result.itinerary.push(maybeSegment);
                return;
            }
    
            const maybeOperated = PriceQuoteParser.parseOperatedByLine(line);
    
            if (maybeOperated && result.itinerary.length > 0) {
                const lastSegment = result.itinerary.pop();
                lastSegment.operatedByString = maybeOperated.operatedByString;
                result.itinerary.push(lastSegment);
                return;
            } else if (maybeOperated) {
                unparsedLines.push(line);
                return;
            }
    
            const maybeSecondAirSegmentLine = PriceQuoteParser.parseAirSegmentSecondLine(line);
    
            if (maybeSecondAirSegmentLine) {
                // do nothing
                return;
            }
            
            if (result.itinerary.length > 0) {
                const lastSegment = result.itinerary.pop();
                lastSegment.additionalInfoLines.push(line);
                result.itinerary.push(lastSegment);
                return;
            }
    
            unparsedLines.push(line);
        });
    
        if (unparsedLines.length > 0) {
            return helpers.mkError(result.unparsedLines = unparsedLines.map(l => {
                return 'Cannot parse line [' + l + ']';
            }));
        } else {
            return helpers.mkResult(result);
        }
    };

    static parseAirSegmentSecondLine(line) {
        return line.match(/^\s+\/DC[A-Z\d]{2}/);
    };

    static parseOperatedByLine(line) {
        if (/OPERATED\sBY\s/.test(line)) {
            return {operatedByString: line.trim()};
        }

        return null;
    };

    static parseAirSegmentLine = function(line, baseDate) {
        const names = {
            N: 'segmentNumber',
            A: 'airline',
            F: 'flightNumber',
            B: 'bookingClass',
            D: 'departureDateRaw',
            W: 'departureDayOfWeek',
            C: 'departureAirport',
            V: 'destinationAirport',
            S: 'segmentStatus',
            T: 'departureTimeRaw',
            X: 'destinationTimeRaw',
        };
        //                                           ' 1 VS  26D 15SEP T JFKLHR SS1   815A  810P /DCVS /E
        const result = helpers.splitByPosition(line, 'NN AAFFFFB DDDDD W CCCVVV SSS  TTTTT XXXXX', names, true);
        result.operatedByString = null;
        result.additionalInfoLines = [];

        const isAirlineValid = result.airline.length === 2 && /^[A-Z\d]{2}$/.test(result.airline);
        const isFlightNumberValid = parseInt(result.flightNumber) > 0;
        const isValidBookingClass = /^[A-Z]{1}$/.test(result.bookingClass);
        const isDepartureDateValid = helpers.parseGdsPartialDate(helpers.orDef(result.departureDateRaw, null), baseDate);
        const areAirportsValid = /^[A-Z]{3}$/.test(result.departureAirport) && /^[A-Z]{3}$/.test(result.destinationAirport);

        if (isAirlineValid && isFlightNumberValid && isValidBookingClass && isDepartureDateValid && areAirportsValid) {
            result.departureDayOfWeekRaw = result.departureDayOfWeek;
            result.departureDayOfWeek = helpers.parseSabreDayOfWeek(result.departureDayOfWeek);
            result.departureDate = helpers.convertToFullDateInFuture(helpers.parseGdsPartialDate(result.departureDateRaw), baseDate);
            result.departureTime = helpers.parseGdsTime(result.departureTimeRaw);
            result.destinationTime = helpers.parseGdsTime(result.destinationTimeRaw);

            const remainderTokens = line.substr(44).split(' ').filter(x => x);

            let destinationDate = helpers.parseGdsPartialDate(helpers.orDef(remainderTokens[0], ''));

            if (destinationDate !== null) {
                result.destinationDateRaw = remainderTokens[0];
            } else {
                result.destinationDateRaw = result.departureDateRaw;
            }

            result.destinationDate = helpers.convertToFullDateInFuture(helpers.parseGdsPartialDate(result.destinationDateRaw), baseDate);

            return result;
        } else {
            return null;
        }
    };
}

exports.PriceQuoteParser = PriceQuoteParser;