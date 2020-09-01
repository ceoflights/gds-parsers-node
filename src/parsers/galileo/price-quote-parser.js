"use strict";

const apolloParser = require(`../../parsers/apollo/price-quote-parser`);

class PriceQuoteParser {
    static parse(dump, baseDate) {
        return apolloParser.PriceQuoteParser.parseTravelportPq(dump, baseDate, 'galileo');
    }
}

exports.PriceQuoteParser = PriceQuoteParser;