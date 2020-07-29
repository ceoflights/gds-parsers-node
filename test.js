const lib = require('./index');
const helpers = require('./helpers');

var assert = require('assert');

describe('helpers', () => {
    describe('#splitByPosition()', () => {
        it('simple split to four groups', () => {
            const result = helpers.splitByPosition(' 1 DL 789H', 'NN AAFFFFB', {N: 'segmentNumber', A: 'airline', F: 'flightNumber', B: 'bookingClass'}, true);

            assert.equal(result.flightNumber, '789');
            assert.equal(result.segmentNumber, '1');
            assert.equal(result.airline, 'DL');
            assert.equal(result.bookingClass, 'H');
        });
    });

    describe('#splitToLines()', () => {
        it('split string to lines', () => {
            const result = helpers.splitToLines("TEST1\nOLOLOLO\nTEST2");

            assert.equal(result.length, 3);
            assert.equal(result[1], 'OLOLOLO');

            // TODO: should return null if passed value isn't a string
        });
    });

    describe('#parseGdsPartialDate()', () => {
        it('parses partial dates', () => {
            assert.deepEqual(helpers.parseGdsPartialDate('23MAR'), {raw: '23MAR', day: 23, month: 3});
            assert.deepEqual(helpers.parseGdsPartialDate('03MAR'), {raw: '03MAR', day: 3, month: 3});
            assert.deepEqual(helpers.parseGdsPartialDate('3MAR'), {raw: '3MAR', day: 3, month: 3});
        })

        it('returns null in case it cannot parse date', () => {
            assert.equal(helpers.parseGdsPartialDate('23mar'), null);
            assert.equal(helpers.parseGdsPartialDate('23MAR '), null);
            assert.equal(helpers.parseGdsPartialDate(' 23MAR '), null);
            assert.equal(helpers.parseGdsPartialDate(' 23MAR'), null);
        });
    });

    describe('#convertToFullDateInFuture()', () => {
        it('converts partial date to full date in future', () => {
            assert.equal(helpers.convertToFullDateInFuture('GARBAGE'), null);
            assert.equal(helpers.convertToFullDateInFuture({month: 05, day: 23}, '2020-07-25'), '2021-05-23');
            assert.equal(helpers.convertToFullDateInFuture({month: 05, day: 23}, '2020-05-23'), '2020-05-23');
            assert.equal(helpers.convertToFullDateInFuture({month: 05, day: 23}, '2020-03-23'), '2020-05-23');
        });
    });

    describe('#parseGdsTime()', () => {
        it('parses 24h GDS time format', () => {
            assert.equal(helpers.parseGdsTime('1536'), '15:36');
        });

        it('parses 12h GDS time format', () => {
            assert.equal(helpers.parseGdsTime('435P'), '16:35');
        });
    });
});

describe('lib', () => {
    describe('#parsePriceQuoteItinerary()', () => {
        it('parse simple Sabre itinerary', () => {
            const dump = [
                ' 1 VS  26D 15SEP T JFKLHR SS1   815A  810P /DCVS /E',
                'PLS ENSURE CTC NBRS ARE IN ALL BKGS PLS CALL VS IF PAX HAS REST',
                'RICTED MOBILITY',
                'OPERATED BY UNITED AIRLINES',
                ' 2 VS 137D 15OCT Q LHRJFK SS1  1230P  325P /DCVS /E',
                'PLS ENSURE CTC NBRS ARE IN ALL BKGS PLS CALL VS IF PAX HAS REST',
                'RICTED MOBILITY',
            ].join("\n");

            const result = lib.parsePriceQuoteItinerary('sabre', '2020-07-25', dump);
            
            assert.deepEqual(result.result, {
                itinerary: [
                  {
                    segmentNumber: '1',
                    airline: 'VS',
                    flightNumber: '26',
                    bookingClass: 'D',
                    departureDateRaw: '15SEP',
                    departureDate: '2020-09-15',
                    destinationDateRaw: '15SEP',
                    destinationDate: '2020-09-15',
                    departureDayOfWeekRaw: 'T',
                    departureDayOfWeek: 2,
                    departureAirport: 'JFK',
                    destinationAirport: 'LHR',
                    segmentStatus: 'SS1',
                    departureTimeRaw: '815A',
                    departureTime: '08:15',
                    destinationTimeRaw: '810P',
                    destinationTime: '20:10',
                    operatedByString: 'OPERATED BY UNITED AIRLINES',
                    additionalInfoLines: [
                        'PLS ENSURE CTC NBRS ARE IN ALL BKGS PLS CALL VS IF PAX HAS REST',
                        'RICTED MOBILITY',
                    ],
                  },
                  {
                    segmentNumber: '2',
                    airline: 'VS',
                    flightNumber: '137',
                    bookingClass: 'D',
                    departureDateRaw: '15OCT',
                    departureDate: '2020-10-15',
                    destinationDateRaw: '15OCT',
                    destinationDate: '2020-10-15',
                    departureDayOfWeekRaw: 'Q',
                    departureDayOfWeek: 4,
                    departureAirport: 'LHR',
                    destinationAirport: 'JFK',
                    segmentStatus: 'SS1',
                    departureTimeRaw: '1230P',
                    departureTime: '12:30',
                    destinationTimeRaw: '325P',
                    destinationTime: '15:25',
                    operatedByString: null,
                    additionalInfoLines: [
                        'PLS ENSURE CTC NBRS ARE IN ALL BKGS PLS CALL VS IF PAX HAS REST',
                        'RICTED MOBILITY',
                    ],
                  }
                ]
              });
        });

        it('parse itinerary with destination date in segment', () => {
            const dump = [
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
              ].join("\n");

              const result = lib.parsePriceQuoteItinerary('sabre', '2020-07-25', dump);
              assert.deepEqual(result.result, {
                itinerary: [
                  {
                    segmentNumber: '1',
                    airline: 'KQ',
                    flightNumber: '1566',
                    bookingClass: 'H',
                    departureDateRaw: '28JUL',
                    departureDate: '2020-07-28',
                    destinationDateRaw: '29JUL',
                    destinationDate: '2020-07-29',
                    departureDayOfWeekRaw: 'Q',
                    departureDayOfWeek: 4,
                    departureAirport: 'NBO',
                    destinationAirport: 'AMS',
                    segmentStatus: 'HK1',
                    departureTimeRaw: '1159P',
                    departureTime: '23:59',
                    destinationTimeRaw: '715A',
                    destinationTime: '07:15',
                    operatedByString: 'OPERATED BY KLM ROYAL DUTCH AIRLINES',
                    additionalInfoLines: [],
                  },
                  {
                    segmentNumber: '2',
                    airline: 'AC',
                    flightNumber: '5949',
                    bookingClass: 'K',
                    departureDateRaw: '29JUL',
                    departureDate: '2020-07-29',
                    destinationDateRaw: '29JUL',
                    destinationDate: '2020-07-29',
                    departureDayOfWeekRaw: 'F',
                    departureDayOfWeek: 5,
                    departureAirport: 'AMS',
                    destinationAirport: 'ORD',
                    segmentStatus: 'HK1',
                    departureTimeRaw: '1105A',
                    departureTime: '11:05',
                    destinationTimeRaw: '105P',
                    destinationTime: '13:05',
                    operatedByString: 'OPERATED BY UNITED AIRLINES',
                    additionalInfoLines: [],
                  },
                  {
                    segmentNumber: '3',
                    airline: 'UA',
                    flightNumber: '4814',
                    bookingClass: 'K',
                    departureDateRaw: '29JUL',
                    departureDate: '2020-07-29',
                    destinationDateRaw: '29JUL',
                    destinationDate: '2020-07-29',
                    departureDayOfWeekRaw: 'F',
                    departureDayOfWeek: 5,
                    departureAirport: 'ORD',
                    destinationAirport: 'STL',
                    segmentStatus: 'HK1',
                    departureTimeRaw: '558P',
                    departureTime: '17:58',
                    destinationTimeRaw: '722P',
                    destinationTime: '19:22',
                    operatedByString: 'OPERATED BY /GOJET AIRLINES DBA UNITED EXPRESS',
                    additionalInfoLines: [
                        'ORD CHECK-IN WITH CHECK IN WITH UNITED TERM 1',
                    ],
                  },
                  {
                    segmentNumber: '4',
                    airline: 'UA',
                    flightNumber: '1129',
                    bookingClass: 'K',
                    departureDateRaw: '28SEP',
                    departureDate: '2020-09-28',
                    destinationDateRaw: '28SEP',
                    destinationDate: '2020-09-28',
                    departureDayOfWeekRaw: 'W',
                    departureDayOfWeek: 3,
                    departureAirport: 'STL',
                    destinationAirport: 'ORD',
                    segmentStatus: 'HK1',
                    departureTimeRaw: '250P',
                    departureTime: '14:50',
                    destinationTimeRaw: '418P',
                    destinationTime: '16:18',
                    operatedByString: null,
                    additionalInfoLines: [],
                  },
                  {
                    segmentNumber: '5',
                    airline: 'AC',
                    flightNumber: '5954',
                    bookingClass: 'K',
                    departureDateRaw: '28SEP',
                    departureDate: '2020-09-28',
                    destinationDateRaw: '29SEP',
                    destinationDate: '2020-09-29',
                    departureDayOfWeekRaw: 'W',
                    departureDayOfWeek: 3,
                    departureAirport: 'ORD',
                    destinationAirport: 'AMS',
                    segmentStatus: 'HK1',
                    departureTimeRaw: '555P',
                    departureTime: '17:55',
                    destinationTimeRaw: '920A',
                    destinationTime: '09:20',
                    operatedByString: 'OPERATED BY UNITED AIRLINES',
                    additionalInfoLines: [],
                  },
                  {
                    segmentNumber: '6',
                    airline: 'KQ',
                    flightNumber: '1565',
                    bookingClass: 'R',
                    departureDateRaw: '29SEP',
                    departureDate: '2020-09-29',
                    destinationDateRaw: '29SEP',
                    destinationDate: '2020-09-29',
                    departureDayOfWeekRaw: 'Q',
                    departureDayOfWeek: 4,
                    departureAirport: 'AMS',
                    destinationAirport: 'NBO',
                    segmentStatus: 'HK1',
                    departureTimeRaw: '1245P',
                    departureTime: '12:45',
                    destinationTimeRaw: '940P',
                    destinationTime: '21:40',
                    operatedByString: 'OPERATED BY KLM ROYAL DUTCH AIRLINES',
                    additionalInfoLines: [],
                  }
                ]
              });
        });
    });
});
