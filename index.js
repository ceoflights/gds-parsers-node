const helpers = require('./helpers');
const moment = require('moment');

/* TODO: add to tests
 Galileo

 1 SQ  21Z 10SEP EWRSIN SS1  1025A  510P+*      TH/FR   E  1
 2 SQ 948Z 11SEP SINDPS SS1   620P  850P *         FR   E  1
 3 SQ 949Z 10OCT DPSSIN SS1   945P 1220A+*      SA/SU   E  2
 4 SQ  32Z 11OCT SINSFO SS1   925A  940A *         SU   E  2


 1 UA1750Z 15SEP FLLIAD SS1   845A 1105A *         TU   E
 2 NH 101Z 15SEP IADHND SS1  1215P  320P+*      TU/WE   E
 3 NH6450Z 14OCT NRTIAH SS1   435P  235P *         WE   E
         OPERATED BY UNITED AIRLINES INC
 4 UA1675Z 14OCT IAHFLL SS1   505P  835P *         WE   E


 1 DL9602I 15SEP ORDAMS SS1   400P  645A+*      TU/WE   E
         OPERATED BY KLM ROYAL DUTCH AIRL
 2 KL1601I 16SEP AMSFCO SS1   935A 1150A *         WE   E
 3 AF9746D 15OCT FCOBOS SS1   305P  625P *         TH   E
         OPERATED BY ALITALIA S.P.A
 4 DL5863D 15OCT BOSORD SS1   818P 1017P *         TH   E
         OPERATED BY REPUBLIC AIRWAYS DELTA CONNECTION

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

const parseTravelportDayOfWeek = function(token) {
    const mapping = {
        MO: 1,
        TU: 2,
        WE: 3,
        TH: 4,
        FR: 5,
        SA: 6,
        SU: 7,
    };

    if (token && mapping.hasOwnProperty(token)) {
        return mapping[token];
    } else {
        return null;
    }
};

// Itinerary air segments format seems to be equal between Apollo/Galileo
const travelportPriceQuoteItineraryParser = function(dump, baseDate) {
    const parseAirSegmentLine = function(line) {
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

        //                                           ' 1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E  1
        const result = helpers.splitByPosition(line, 'NN AAFFFFB DDDDD CCCVVV SSS  TTTTT XXXXXP       UU II      M', names, true);
        result.operatedByString = null;
        result.additionalInfoLines = [];

        const isAirlineValid = result.airline.length === 2 && /^[A-Z\d]{2}$/.test(result.airline);
        const isFlightNumberValid = parseInt(result.flightNumber) > 0;
        const isValidBookingClass = /^[A-Z]{1}$/.test(result.bookingClass);
        const isDepartureDateValid = helpers.parseGdsPartialDate(helpers.orDef(result.departureDateRaw, null), baseDate);

        if (isAirlineValid && isFlightNumberValid && isValidBookingClass && isDepartureDateValid) {
            result.departureDayOfWeek = parseTravelportDayOfWeek(result.departureDayOfWeekRaw ? result.departureDayOfWeekRaw : result.destinationDayOfWeekRaw);
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

const sabrePriceQuoteItineraryParser = function(dump, baseDate) {

    const parseAirSegmentLine = function(line) {
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

        if (isAirlineValid && isFlightNumberValid && isValidBookingClass && isDepartureDateValid) {
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

// TODO: collection of hacks like missing first space in the first segment line
exports.parsePriceQuoteItinerary = function(gds, baseDate, dump) {
    if (gds === 'sabre') {
        return sabrePriceQuoteItineraryParser(dump, baseDate);
    } else if (gds === 'galileo') {
        return travelportPriceQuoteItineraryParser(dump, baseDate);
    } else if (gds === 'apollo') {
        return travelportPriceQuoteItineraryParser(dump, baseDate);
    } else {
        return exports.mkError('Unsupported GDS - ' + gds);
    }
};

