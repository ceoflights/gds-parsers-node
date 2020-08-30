"use strict";

const helpers = require('./src/helpers');

const parsers = {};
parsers.apollo = {};
parsers.sabre = {};
parsers.galileo = {};

Object.assign(parsers.apollo, require('./src/parsers/apollo/price-quote-parser'));
Object.assign(parsers.apollo, require('./src/parsers/apollo/service-info-parser'));

Object.assign(parsers.sabre, require('./src/parsers/sabre/price-quote-parser'));
Object.assign(parsers.sabre, require('./src/parsers/sabre/service-info-parser'));

Object.assign(parsers.galileo, require('./src/parsers/galileo/price-quote-parser'));
Object.assign(parsers.galileo, require('./src/parsers/apollo/service-info-parser')); // Galileo and Apollo *SVC formats are supported by common parser

const preprocessPastedPqDump = function(_gds, _baseDate, dump) {
    return helpers.fixFirstSegmentLine(dump);
};

function _postprocessTravelportServiceInfo(result) {
    result.segments = result.segments.map((segment) => {
        const resultSegment = {
            segmentNumber: segment.segmentNumber,
            airline: segment.airline,
            flightNumber: segment.flightNumber,
            miscInfoLines: segment.miscInfoLines,
            legs: segment.legs.map((leg) => {
                return {
                    departureAirport: leg.departureAirport,
                    destinationAirport: leg.destinationAirport,
                    aircraft: leg.aircraft,
                    mealOptions: {raw: leg.mealOptions, parsed: leg.mealOptionsParsed},
                    flightDuration: leg.flightDuration,
                    departureTerminal: {raw: "", parsed: null},
                    destinationTerminal: {raw: "", parsed: null},
                };
            }),
        };

        if (helpers.orDef(segment.departureTerminal, '').length > 0) {
            let firstLeg = resultSegment.legs.shift();
            firstLeg.departureTerminal = {raw: segment.departureTerminal, parsed: segment.departureTerminal};
            resultSegment.legs.unshift(firstLeg);
        }

        if (helpers.orDef(segment.arrivalTerminal, '').length > 0) {
            let lastLeg = resultSegment.legs.pop();
            lastLeg.destinationTerminal = {raw: segment.arrivalTerminal, parsed: segment.arrivalTerminal};
            resultSegment.legs.push(lastLeg);
        }

        return resultSegment;
    });

    return result;
}

function _postprocessSabreServiceInfo(result) {
    result.segments = result.segments.map((segment) => {
        return {
            segmentNumber: segment.segmentNumber,
            airline: segment.airline,
            flightNumber: segment.flightNumber,
            miscInfoLines: [],
            legs: segment.legs.map((leg) => {
                return {
                    departureAirport: leg.departureAirport,
                    destinationAirport: leg.destinationAirport,
                    aircraft: leg.aircraft,
                    mealOptions: leg.mealOptions,
                    flightDuration: leg.flightDuration,
                    departureTerminal: leg.departureTerminal,
                    destinationTerminal: leg.destinationTerminal,
                };
            }),
        };
    });

    return result;
}

exports.parsers = parsers;
exports.parsePriceQuoteItinerary = function(gds, baseDate, dump) {
    dump = preprocessPastedPqDump(gds, baseDate, dump);

    if (gds === 'sabre') {
        return parsers.sabre.PriceQuoteParser.parse(dump, baseDate);
    } else if (gds === 'galileo') {
        return parsers.galileo.PriceQuoteParser.parse(dump, baseDate);
    } else if (gds === 'apollo') {
        return parsers.apollo.PriceQuoteParser.parse(dump, baseDate);
    } else {
        return helpers.mkError('Unsupported GDS - ' + gds);
    }
};

exports.parseServiceInfoDump = function(gds, _baseDate, dump) {
    if (gds === 'apollo') {
        return helpers.mkResult(_postprocessTravelportServiceInfo(parsers.apollo.ServiceInfoParser.parse(dump)));
    } else if (gds === 'galileo') {
        return helpers.mkResult(_postprocessTravelportServiceInfo(parsers.galileo.ServiceInfoParser.parse(dump)));
    } else if (gds === 'sabre') {
        return helpers.mkResult(_postprocessSabreServiceInfo(parsers.sabre.ServiceInfoParser.parse(dump)));
    } else {
        return helpers.mkError('Unsupported GDS - ' + gds);
    }
}