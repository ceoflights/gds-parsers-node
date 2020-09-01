"use strict";

const helpers = require(`../../helpers`);

const moment = require('moment');

class PriceQuoteParser {
    static parse(dump, baseDate) {
        return this.parseTravelportPq(dump, baseDate, 'apollo');
    }

    // Ideally this should be moved somewhere to "common" parsers.
    static parseTravelportPq(dump, baseDate, gds) {
        const result = {itinerary: []};
        const unparsedLines = [];
        const lines = helpers.splitToLines(dump);
    
        lines.forEach(line => {
            const maybeSegment = PriceQuoteParser.parseAirSegmentLine(line, baseDate, gds);
    
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

    static parseOperatedByLine = function(line) {
        if (/OPERATED\sBY\s/.test(line)) {
            return {operatedByString: line.trim()};
        }

        return null;
    };

    static parseAirSegmentLine = function(line, baseDate, gds) {
        const names = {
            N: 'segmentNumber',
            A: 'airline',
            F: 'flightNumber',
            B: 'bookingClass',
            D: 'departureDateRaw',
            C: 'departureAirport',
            V: 'destinationAirport',
            S: 'segmentStatus',
            T: 'departureTimeRaw',
            X: 'destinationTimeRaw',
            P: 'destinationDateOffsetToken',
            U: 'departureDayOfWeekRaw',
            I: 'destinationDayOfWeekRaw',
            M: 'segmentMarriageId',
        };

        let result = null;

        if (gds === 'galileo') {
            // Galileo
            //                                     ' 2. LH  595 L  17MAY PHCFRA HS1   755P # 525A O          TH  1',
            result = helpers.splitByPosition(line, 'NN  AA FFFF B  DDDDD CCCVVV SSS  TTTTT PXXXXX            UU  M', names, true);
        } else {
            // Apollo
            //                                     ' 1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E  1
            result = helpers.splitByPosition(line, 'NN AAFFFFB DDDDD CCCVVV SSS  TTTTT XXXXXP       UU II      M', names, true);
        }


        result.operatedByString = null;
        result.additionalInfoLines = [];

        const isAirlineValid = result.airline.length === 2 && /^[A-Z\d]{2}$/.test(result.airline);
        const isFlightNumberValid = parseInt(result.flightNumber) > 0;
        const isValidBookingClass = /^[A-Z]{1}$/.test(result.bookingClass);
        const isDepartureDateValid = helpers.parseGdsPartialDate(helpers.orDef(result.departureDateRaw, null), baseDate);
        const areAirportsValid = /^[A-Z]{3}$/.test(result.departureAirport) && /^[A-Z]{3}$/.test(result.destinationAirport);

        if (isAirlineValid && isFlightNumberValid && isValidBookingClass && isDepartureDateValid && areAirportsValid) {
            result.departureDayOfWeek = helpers.parseTravelportDayOfWeek(result.departureDayOfWeekRaw ? result.departureDayOfWeekRaw : result.destinationDayOfWeekRaw);
            result.departureDate = helpers.convertToFullDateInFuture(helpers.parseGdsPartialDate(result.departureDateRaw), baseDate);
            result.departureTime = helpers.parseGdsTime(result.departureTimeRaw);
            result.destinationTime = helpers.parseGdsTime(result.destinationTimeRaw);
            result.destinationDateOffset = helpers.decodeDayOffset(result.destinationDateOffsetToken);
            result.destinationDate = moment(result.departureDate, 'YYYY-MM-DD').add(result.destinationDateOffset, 'days').format('YYYY-MM-DD');

            return result;
        } else {
            return null;
        }
    };
}

exports.PriceQuoteParser = PriceQuoteParser;