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
        });

        it('returns null if passed value isn\'t a string', () => {
            assert.equal(helpers.splitToLines({}), null);
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

    describe('#fixFirstSegmentLine()', () => {
        it('doesn\'t make any changes to the correct dump', () => {
            const dump = [
                ' 1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            assert.equal(helpers.fixFirstSegmentLine(dump), dump);
        });

        it('prepends space in case it was missing', () => {
            const dump = [
                '1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            assert.equal(helpers.fixFirstSegmentLine(dump), ' ' + dump);
        });

        it('doesn\'t get fooled by segment numbers starting from 10+', () => {
            const dump = [
                '10 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            assert.equal(helpers.fixFirstSegmentLine(dump), dump);
        });

        it('doesn\'t make any changes to the empty string', () => {
            assert.equal(helpers.fixFirstSegmentLine(''), '');
        });

        it('returns null if passed value isn\'t a string', () => {
            assert.equal(helpers.fixFirstSegmentLine(null), null);
            assert.equal(helpers.fixFirstSegmentLine(undefined), null);
            assert.deepEqual(helpers.fixFirstSegmentLine({}), null);
            assert.deepEqual(helpers.fixFirstSegmentLine([1, 2, 3]), null);
        });
    });
});

describe('lib', () => {
    describe('#parsePriceQuoteItinerary()', () => {
        it('parse Galileo itinerary', () => {

            const dump = [
                ' 1 SQ  21Z 10SEP EWRSIN SS1  1025A  510P+*      TH/FR   E  1',
                ' 2 SQ 948Z 11SEP SINDPS SS1   620P  850P *         FR   E  1',
                ' 3 SQ 949Z 10OCT DPSSIN SS1   945P 1220A+*      SA/SU   E  2',
                ' 4 SQ  32Z 11OCT SINSFO SS1   925A  940A *         SU   E  2',
            ].join("\n");

            const result = lib.parsePriceQuoteItinerary('galileo', '2020-08-05', dump);

            assert.deepEqual(result.result, {
                "itinerary": [
                    {
                        "segmentNumber": "1",
                        "airline": "SQ",
                        "flightNumber": "21",
                        "bookingClass": "Z",
                        "departureDateRaw": "10SEP",
                        "departureAirport": "EWR",
                        "destinationAirport": "SIN",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "1025A",
                        "destinationTimeRaw": "510P",
                        "destinationDateOffsetToken": "+",
                        "departureDayOfWeekRaw": "TH",
                        "destinationDayOfWeekRaw": "FR",
                        "segmentMarriageId": "1",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 4,
                        "departureDate": "2020-09-10",
                        "departureTime": "10:25",
                        "destinationTime": "17:10",
                        "destinationDateOffset": 1,
                        "destinationDate": "2020-09-11"
                    },
                    {
                        "segmentNumber": "2",
                        "airline": "SQ",
                        "flightNumber": "948",
                        "bookingClass": "Z",
                        "departureDateRaw": "11SEP",
                        "departureAirport": "SIN",
                        "destinationAirport": "DPS",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "620P",
                        "destinationTimeRaw": "850P",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "FR",
                        "segmentMarriageId": "1",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 5,
                        "departureDate": "2020-09-11",
                        "departureTime": "18:20",
                        "destinationTime": "20:50",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-09-11"
                    },
                    {
                        "segmentNumber": "3",
                        "airline": "SQ",
                        "flightNumber": "949",
                        "bookingClass": "Z",
                        "departureDateRaw": "10OCT",
                        "departureAirport": "DPS",
                        "destinationAirport": "SIN",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "945P",
                        "destinationTimeRaw": "1220A",
                        "destinationDateOffsetToken": "+",
                        "departureDayOfWeekRaw": "SA",
                        "destinationDayOfWeekRaw": "SU",
                        "segmentMarriageId": "2",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 6,
                        "departureDate": "2020-10-10",
                        "departureTime": "21:45",
                        "destinationTime": "00:20",
                        "destinationDateOffset": 1,
                        "destinationDate": "2020-10-11"
                    },
                    {
                        "segmentNumber": "4",
                        "airline": "SQ",
                        "flightNumber": "32",
                        "bookingClass": "Z",
                        "departureDateRaw": "11OCT",
                        "departureAirport": "SIN",
                        "destinationAirport": "SFO",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "925A",
                        "destinationTimeRaw": "940A",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "SU",
                        "segmentMarriageId": "2",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 7,
                        "departureDate": "2020-10-11",
                        "departureTime": "09:25",
                        "destinationTime": "09:40",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-10-11"
                    }
                ]
            });
        });

        it('parse Galileo itinerary with OPERATED BY', () => {
            const dump = [
                ' 1 UA1750Z 15SEP FLLIAD SS1   845A 1105A *         TU   E',
                ' 2 NH 101Z 15SEP IADHND SS1  1215P  320P+*      TU/WE   E',
                ' 3 NH6450Z 14OCT NRTIAH SS1   435P  235P *         WE   E',
                '         OPERATED BY UNITED AIRLINES INC',
                ' 4 UA1675Z 14OCT IAHFLL SS1   505P  835P *         WE   E',
            ].join("\n");

            const result = lib.parsePriceQuoteItinerary('galileo', '2020-08-05', dump);

            assert.deepEqual(result.result, {
                "itinerary": [
                    {
                        "segmentNumber": "1",
                        "airline": "UA",
                        "flightNumber": "1750",
                        "bookingClass": "Z",
                        "departureDateRaw": "15SEP",
                        "departureAirport": "FLL",
                        "destinationAirport": "IAD",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "845A",
                        "destinationTimeRaw": "1105A",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "TU",
                        "segmentMarriageId": "",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 2,
                        "departureDate": "2020-09-15",
                        "departureTime": "08:45",
                        "destinationTime": "11:05",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-09-15"
                    },
                    {
                        "segmentNumber": "2",
                        "airline": "NH",
                        "flightNumber": "101",
                        "bookingClass": "Z",
                        "departureDateRaw": "15SEP",
                        "departureAirport": "IAD",
                        "destinationAirport": "HND",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "1215P",
                        "destinationTimeRaw": "320P",
                        "destinationDateOffsetToken": "+",
                        "departureDayOfWeekRaw": "TU",
                        "destinationDayOfWeekRaw": "WE",
                        "segmentMarriageId": "",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 2,
                        "departureDate": "2020-09-15",
                        "departureTime": "12:15",
                        "destinationTime": "15:20",
                        "destinationDateOffset": 1,
                        "destinationDate": "2020-09-16"
                    },
                    {
                        "segmentNumber": "3",
                        "airline": "NH",
                        "flightNumber": "6450",
                        "bookingClass": "Z",
                        "departureDateRaw": "14OCT",
                        "departureAirport": "NRT",
                        "destinationAirport": "IAH",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "435P",
                        "destinationTimeRaw": "235P",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "WE",
                        "segmentMarriageId": "",
                        "operatedByString": "OPERATED BY UNITED AIRLINES INC",
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 3,
                        "departureDate": "2020-10-14",
                        "departureTime": "16:35",
                        "destinationTime": "14:35",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-10-14"
                    },
                    {
                        "segmentNumber": "4",
                        "airline": "UA",
                        "flightNumber": "1675",
                        "bookingClass": "Z",
                        "departureDateRaw": "14OCT",
                        "departureAirport": "IAH",
                        "destinationAirport": "FLL",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "505P",
                        "destinationTimeRaw": "835P",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "WE",
                        "segmentMarriageId": "",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 3,
                        "departureDate": "2020-10-14",
                        "departureTime": "17:05",
                        "destinationTime": "20:35",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-10-14"
                    }
                ]
            });
        });

        it('parse Galileo itinerary with missing space in the first line', () => {
            const dump = [
                '1 DL9602I 15SEP ORDAMS SS1   400P  645A+*      TU/WE   E',
                '     OPERATED BY KLM ROYAL DUTCH AIRL',
                ' 2 KL1601I 16SEP AMSFCO SS1   935A 1150A *         WE   E',
                ' 3 AF9746D 15OCT FCOBOS SS1   305P  625P *         TH   E',
                '     OPERATED BY ALITALIA S.P.A',
                ' 4 DL5863D 15OCT BOSORD SS1   818P 1017P *         TH   E',
                '     OPERATED BY REPUBLIC AIRWAYS DELTA CONNECTION',
            ].join("\n");

            const result = lib.parsePriceQuoteItinerary('galileo', '2020-08-05', dump);

            assert.deepEqual(result.result, {
                "itinerary": [
                    {
                        "segmentNumber": "1",
                        "airline": "DL",
                        "flightNumber": "9602",
                        "bookingClass": "I",
                        "departureDateRaw": "15SEP",
                        "departureAirport": "ORD",
                        "destinationAirport": "AMS",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "400P",
                        "destinationTimeRaw": "645A",
                        "destinationDateOffsetToken": "+",
                        "departureDayOfWeekRaw": "TU",
                        "destinationDayOfWeekRaw": "WE",
                        "segmentMarriageId": "",
                        "operatedByString": "OPERATED BY KLM ROYAL DUTCH AIRL",
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 2,
                        "departureDate": "2020-09-15",
                        "departureTime": "16:00",
                        "destinationTime": "06:45",
                        "destinationDateOffset": 1,
                        "destinationDate": "2020-09-16"
                    },
                    {
                        "segmentNumber": "2",
                        "airline": "KL",
                        "flightNumber": "1601",
                        "bookingClass": "I",
                        "departureDateRaw": "16SEP",
                        "departureAirport": "AMS",
                        "destinationAirport": "FCO",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "935A",
                        "destinationTimeRaw": "1150A",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "WE",
                        "segmentMarriageId": "",
                        "operatedByString": null,
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 3,
                        "departureDate": "2020-09-16",
                        "departureTime": "09:35",
                        "destinationTime": "11:50",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-09-16"
                    },
                    {
                        "segmentNumber": "3",
                        "airline": "AF",
                        "flightNumber": "9746",
                        "bookingClass": "D",
                        "departureDateRaw": "15OCT",
                        "departureAirport": "FCO",
                        "destinationAirport": "BOS",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "305P",
                        "destinationTimeRaw": "625P",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "TH",
                        "segmentMarriageId": "",
                        "operatedByString": "OPERATED BY ALITALIA S.P.A",
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 4,
                        "departureDate": "2020-10-15",
                        "departureTime": "15:05",
                        "destinationTime": "18:25",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-10-15"
                    },
                    {
                        "segmentNumber": "4",
                        "airline": "DL",
                        "flightNumber": "5863",
                        "bookingClass": "D",
                        "departureDateRaw": "15OCT",
                        "departureAirport": "BOS",
                        "destinationAirport": "ORD",
                        "segmentStatus": "SS1",
                        "departureTimeRaw": "818P",
                        "destinationTimeRaw": "1017P",
                        "destinationDateOffsetToken": "",
                        "departureDayOfWeekRaw": "",
                        "destinationDayOfWeekRaw": "TH",
                        "segmentMarriageId": "",
                        "operatedByString": "OPERATED BY REPUBLIC AIRWAYS DELTA CONNECTION",
                        "additionalInfoLines": [],
                        "departureDayOfWeek": 4,
                        "departureDate": "2020-10-15",
                        "departureTime": "20:18",
                        "destinationTime": "22:17",
                        "destinationDateOffset": 0,
                        "destinationDate": "2020-10-15"
                    }
                ]
            });
        });

        it('parse Apollo itinerary with day after tomorrow token', () => {
            const dump = [
                '1 CZ 328T 21APR LAXCAN HK1  1150P  540A2*      TH/SA   E',
                ' 2 CZ3203Y 23APR CANXIY HK1   915A 1145A *         SA   E',
                ' 3 CZ6896Y 24APR XIYDNH UN1   110P  340P *         SU   E',
                ' 4 CZ6896Y 25APR XIYDNH UN1   110P  340P *         MO   E',
                ' 5 CZ6885Y 04MAY KHGCAN WK1  1155A  735P *         WE   E',
                ' 6 CZ6885Y 04MAY KHGCAN TK1  1145A  735P *         WE   E',
                ' 7 CZ 327Z 04MAY CANLAX HK1   930P  740P *         WE   E',
            ].join("\n");

            const result = lib.parsePriceQuoteItinerary('apollo', '2020-08-01', dump);
            assert.deepEqual(result.result, {
                itinerary: [
                    {
                        segmentNumber: '1',
                        airline: 'CZ',
                        flightNumber: '328',
                        bookingClass: 'T',
                        departureDateRaw: '21APR',
                        departureAirport: 'LAX',
                        destinationAirport: 'CAN',
                        segmentStatus: 'HK1',
                        departureTimeRaw: '1150P',
                        destinationTimeRaw: '540A',
                        destinationDateOffsetToken: '2',
                        destinationDateOffset: 2,
                        destinationDate: '2021-04-23',
                        departureDayOfWeekRaw: 'TH',
                        destinationDayOfWeekRaw: 'SA',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 4,
                        departureDate: '2021-04-21',
                        departureTime: '23:50',
                        destinationTime: '05:40'
                    },
                    {
                        segmentNumber: '2',
                        airline: 'CZ',
                        flightNumber: '3203',
                        bookingClass: 'Y',
                        departureDateRaw: '23APR',
                        departureAirport: 'CAN',
                        destinationAirport: 'XIY',
                        segmentStatus: 'HK1',
                        departureTimeRaw: '915A',
                        destinationTimeRaw: '1145A',
                        destinationDateOffsetToken: '',
                        destinationDateOffset: 0,
                        destinationDate: '2021-04-23',
                        departureDayOfWeekRaw: '',
                        destinationDayOfWeekRaw: 'SA',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 6,
                        departureDate: '2021-04-23',
                        departureTime: '09:15',
                        destinationTime: '11:45'
                    },
                    {
                        segmentNumber: '3',
                        airline: 'CZ',
                        flightNumber: '6896',
                        bookingClass: 'Y',
                        departureDateRaw: '24APR',
                        departureAirport: 'XIY',
                        destinationAirport: 'DNH',
                        segmentStatus: 'UN1',
                        departureTimeRaw: '110P',
                        destinationTimeRaw: '340P',
                        destinationDateOffsetToken: '',
                        destinationDateOffset: 0,
                        destinationDate: '2021-04-24',
                        departureDayOfWeekRaw: '',
                        destinationDayOfWeekRaw: 'SU',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 7,
                        departureDate: '2021-04-24',
                        departureTime: '13:10',
                        destinationTime: '15:40'
                    },
                    {
                        segmentNumber: '4',
                        airline: 'CZ',
                        flightNumber: '6896',
                        bookingClass: 'Y',
                        departureDateRaw: '25APR',
                        departureAirport: 'XIY',
                        destinationAirport: 'DNH',
                        segmentStatus: 'UN1',
                        departureTimeRaw: '110P',
                        destinationTimeRaw: '340P',
                        destinationDateOffsetToken: '',
                        destinationDateOffset: 0,
                        destinationDate: '2021-04-25',
                        departureDayOfWeekRaw: '',
                        destinationDayOfWeekRaw: 'MO',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 1,
                        departureDate: '2021-04-25',
                        departureTime: '13:10',
                        destinationTime: '15:40'
                    },
                    {
                        segmentNumber: '5',
                        airline: 'CZ',
                        flightNumber: '6885',
                        bookingClass: 'Y',
                        departureDateRaw: '04MAY',
                        departureAirport: 'KHG',
                        destinationAirport: 'CAN',
                        segmentStatus: 'WK1',
                        departureTimeRaw: '1155A',
                        destinationTimeRaw: '735P',
                        destinationDateOffsetToken: '',
                        destinationDateOffset: 0,
                        destinationDate: '2021-05-04',
                        departureDayOfWeekRaw: '',
                        destinationDayOfWeekRaw: 'WE',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 3,
                        departureDate: '2021-05-04',
                        departureTime: '11:55',
                        destinationTime: '19:35'
                    },
                    {
                        segmentNumber: '6',
                        airline: 'CZ',
                        flightNumber: '6885',
                        bookingClass: 'Y',
                        departureDateRaw: '04MAY',
                        departureAirport: 'KHG',
                        destinationAirport: 'CAN',
                        segmentStatus: 'TK1',
                        departureTimeRaw: '1145A',
                        destinationTimeRaw: '735P',
                        destinationDateOffsetToken: '',
                        destinationDateOffset: 0,
                        destinationDate: '2021-05-04',
                        departureDayOfWeekRaw: '',
                        destinationDayOfWeekRaw: 'WE',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 3,
                        departureDate: '2021-05-04',
                        departureTime: '11:45',
                        destinationTime: '19:35'
                    },
                    {
                        segmentNumber: '7',
                        airline: 'CZ',
                        flightNumber: '327',
                        bookingClass: 'Z',
                        departureDateRaw: '04MAY',
                        departureAirport: 'CAN',
                        destinationAirport: 'LAX',
                        segmentStatus: 'HK1',
                        departureTimeRaw: '930P',
                        destinationTimeRaw: '740P',
                        destinationDateOffsetToken: '',
                        destinationDateOffset: 0,
                        destinationDate: '2021-05-04',
                        departureDayOfWeekRaw: '',
                        destinationDayOfWeekRaw: 'WE',
                        segmentMarriageId: '',
                        operatedByString: null,
                        additionalInfoLines: [],
                        departureDayOfWeek: 3,
                        departureDate: '2021-05-04',
                        departureTime: '21:30',
                        destinationTime: '19:40'
                    }
                ]
              });
        });

        it('parse Sabre itinerary', () => {
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

        it('parse Sabre itinerary with destination date in segment', () => {
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
