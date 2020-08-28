"use strict";

const helpers = require('./src/helpers');

const parsers = {};
parsers.apollo = {};
parsers.sabre = {};
parsers.galileo = {};

Object.assign(parsers.apollo, require('./src/parsers/apollo/price-quote-parser'));
Object.assign(parsers.apollo, require('./src/parsers/apollo/service-info-parser'));

Object.assign(parsers.sabre, require('./src/parsers/sabre/price-quote-parser'));

Object.assign(parsers.galileo, require('./src/parsers/galileo/price-quote-parser'));

const preprocessPastedPqDump = function(_gds, _baseDate, dump) {
    return helpers.fixFirstSegmentLine(dump);
};

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
        return exports.mkError('Unsupported GDS - ' + gds);
    }
};

exports.parseServiceInfoDump = function(gds, baseDate, dump) {
    if (gds === 'apollo') {
        return exports.mkResult(parsers.apollo.ServiceInfoParser.parse(dump));
    } else {
        return exports.mkError('Unsupported GDS - ' + gds);
    }
}