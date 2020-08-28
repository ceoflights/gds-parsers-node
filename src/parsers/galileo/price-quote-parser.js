"use strict";

const root = require('app-root-path');
const apolloParser = require(`${root}/src/parsers/apollo/price-quote-parser`);

class PriceQuoteParser {
    static parse(dump, baseDate) {
        return apolloParser.PriceQuoteParser.parseTravelportPq(dump, baseDate, 'galileo');
    }
}

exports.PriceQuoteParser = PriceQuoteParser;