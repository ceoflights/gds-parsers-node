const helpers = require('./helpers');

/*
 1 VS  26D 15SEP T JFKLHR SS1   815A  810P /DCVS /E
PLS ENSURE CTC NBRS ARE IN ALL BKGS PLS CALL VS IF PAX HAS REST
RICTED MOBILITY
 2 VS 137D 15OCT Q LHRJFK SS1  1230P  325P /DCVS /E
PLS ENSURE CTC NBRS ARE IN ALL BKGS PLS CALL VS IF PAX HAS REST
RICTED MOBILITY
*/

/*
                ' 1 KQ1566H 28JUL Q NBOAMS HK1  1159P  715A  29JUL F',
                '                                               /DCKQ*Y24K24 /E',
                'OPERATED BY KLM ROYAL DUTCH AIRLINES',
                ' 2 AC5949K 29JUL F AMSORD HK1  1105A  105P /DCAC*ARYTWR /E',
                'OPERATED BY UNITED AIRLINES',
                ' 3 UA4814K 29JUL F ORDSTL HK1   558P  722P /DCUA*CLK26C /E',
                'OPERATED BY /GOJET AIRLINES DBA UNITED EXPRESS',
                'ORD CHECK-IN WITH CHECK IN WITH UNITED TERM 1',
                ' 4 UA1129K 28SEP W STLORD HK1   250P  418P /DCUA*CLK26C /E',
                ' 5 AC5954K 28SEP W ORDAMS HK1   555P  920A  29SEP Q',
                '                                               /DCAC*ARYTWR /E',
                'OPERATED BY UNITED AIRLINES',
                ' 6 KQ1565R 29SEP Q AMSNBO HK1  1245P  940P /DCKQ*Y24K24 /E',
                'OPERATED BY KLM ROYAL DUTCH AIRLINES',
*/

const parseSabreDayOfWeek = function(token) {
    const mapping = {
        M: 1,
        T: 2,
        W: 3,
        Q: 4,
        F: 5,
        J: 6,
        S: 7,
    };

    if (token && /^\d$/.test(token)) {
        return token;
    } else if (token && mapping.hasOwnProperty(token)) {
        return mapping[token];
    } else {
        return null;
    }
};

const sabrePriceQuoteItineraryParser = function(dump, baseDate) {
    // TODO: splitted line
    const parseAirSegmentLine = function(line) {
        // TODO: present or missing destination date/day of week. seems like present if differs from departure
        //segmentNumber,airline,flightNumber,bookingClass,departureDate,departureDayOfWeek,departureAirport,destinationAirport,segmentStatus,departureTime,destinationTime,?confirmationAirline,?confirmationCode,/E???

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

        // TODO: validating and parsing of dates and times
        // TODO: parsing destination date if present

        if (isAirlineValid && isFlightNumberValid && isValidBookingClass) {
            result.departureDayOfWeekRaw = result.departureDayOfWeek;
            result.departureDayOfWeek = parseSabreDayOfWeek(result.departureDayOfWeek);
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

    const parseAirSegmentSecondLine = function(line) {
        return line.match(/^\s+\/DC[A-Z\d]{2}/);
    };

    const parseOperatedByLine = function(line) {
        if (/OPERATED\sBY\s/.test(line)) {
            return {operatedByString: line.trim()};
        }

        return null;
    };
    
    const result = {itinerary: []};

    const lines = helpers.splitToLines(dump);

    lines.forEach(line => {
        const maybeSegment = parseAirSegmentLine(line);

        if (maybeSegment) {
            result.itinerary.push(maybeSegment);
            return;
        }

        const maybeOperated = parseOperatedByLine(line);

        if (maybeOperated) {
            const lastSegment = result.itinerary.pop();
            lastSegment.operatedByString = maybeOperated.operatedByString;
            result.itinerary.push(lastSegment);
            return;
        }

        const maybeSecondAirSegmentLine = parseAirSegmentSecondLine(line);

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
    });

    // TODO: sanity checks and return mkError

    return helpers.mkResult(result);
};

exports.parsePriceQuoteItinerary = function(gds, baseDate, dump) {
    if (gds === 'sabre') {
        return sabrePriceQuoteItineraryParser(dump, baseDate);
    } else if (gds === 'galileo') {
        return exports.mkError('TODO: implement galileo parser');
    } else {
        return exports.mkError('Unsupported GDS - ' + gds);
    }
};

