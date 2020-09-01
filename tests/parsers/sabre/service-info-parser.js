"use strict";

const assert = require('assert');

const lib = require.main.require(`../../../index`);

describe('Sabre ServiceInfoParser', () => {
    it('parse Sabre VI* dump', () => {
        const dump = [
            '   FLIGHT  DATE  SEGMENT DPTR  ARVL    MLS  EQP  ELPD MILES SM ',
            ' 1 AA*4030 13NOV BWI PHL  420P  509P        CRJ   .49    91  N ',
            '                                ARR-TERMINAL F                 ',
            '*BWI-PHL OPERATED BY AIR WISCONSIN AS AMERICAN EAGLE',
            'ONEWORLD',
            ' 2 AA  718 13NOV PHL FCO  640P  910A¥1 DK   333  8.30  4368  N ',
            'DEP-TERMINAL A                  ARR-TERMINAL 3                 ',
            'ONEWORLD',
            ' 3 AA*6697 23NOV FCO LHR  800A  950A   M    320  2.50   894  N ',
            'DEP-TERMINAL 3                  ARR-TERMINAL 5                 ',
            '*FCO-LHR OPERATED BY BRITISH AIRWAYS',
            'ONEWORLD',
            ' 4 AA*6174 23NOV LHR BWI  140P  455P   M    787  8.15  3641  N ',
            'DEP-TERMINAL 5                                                 ',
            '*LHR-BWI OPERATED BY BRITISH AIRWAYS',
            'ONEWORLD',
        ].join("\n");

        const result = {
            "segments": [
                {
                    "segmentNumber": "1",
                    "airline": "AA",
                    "flightNumber": "4030",
                    "legs": [
                        {
                            "departureDate": {
                                "raw": "13NOV",
                                "parsed": "11-13"
                            },
                            "departureAirport": "BWI",
                            "destinationAirport": "PHL",
                            "departureTime": {
                                "raw": "420P",
                                "parsed": "16:20"
                            },
                            "destinationTime": {
                                "raw": "509P",
                                "parsed": "17:09"
                            },
                            "offset": 0,
                            "meals": {
                                "raw": "",
                                "parsed": []
                            },
                            "smoking": false,
                            "aircraft": "CRJ",
                            "flightDuration": "00:49",
                            "miles": "91",
                            "departureTerminal": {
                                "raw": "",
                                "parsed": null
                            },
                            "destinationTerminal": {
                                "raw": "TERMINAL F",
                                "parsed": "F"
                            }
                        }
                    ],
                    "hasPlaneChange": false
                },
                {
                    "segmentNumber": "2",
                    "airline": "AA",
                    "flightNumber": "718",
                    "legs": [
                        {
                            "departureDate": {
                                "raw": "13NOV",
                                "parsed": "11-13"
                            },
                            "departureAirport": "PHL",
                            "destinationAirport": "FCO",
                            "departureTime": {
                                "raw": "640P",
                                "parsed": "18:40"
                            },
                            "destinationTime": {
                                "raw": "910A",
                                "parsed": "09:10"
                            },
                            "offset": 1,
                            "meals": {
                                "raw": "DK",
                                "parsed": [
                                    "MEAL_DINNER",
                                    "MEAL_CONTINENTAL_BREAKFAST"
                                ]
                            },
                            "smoking": false,
                            "aircraft": "333",
                            "flightDuration": "08:30",
                            "miles": "4368",
                            "departureTerminal": {
                                "raw": "TERMINAL A",
                                "parsed": "A"
                            },
                            "destinationTerminal": {
                                "raw": "TERMINAL 3",
                                "parsed": "3"
                            }
                        }
                    ],
                    "hasPlaneChange": false
                },
                {
                    "segmentNumber": "3",
                    "airline": "AA",
                    "flightNumber": "6697",
                    "legs": [
                        {
                            "departureDate": {
                                "raw": "23NOV",
                                "parsed": "11-23"
                            },
                            "departureAirport": "FCO",
                            "destinationAirport": "LHR",
                            "departureTime": {
                                "raw": "800A",
                                "parsed": "08:00"
                            },
                            "destinationTime": {
                                "raw": "950A",
                                "parsed": "09:50"
                            },
                            "offset": 0,
                            "meals": {
                                "raw": "M",
                                "parsed": [
                                    "MEAL_MEAL"
                                ]
                            },
                            "smoking": false,
                            "aircraft": "320",
                            "flightDuration": "02:50",
                            "miles": "894",
                            "departureTerminal": {
                                "raw": "TERMINAL 3",
                                "parsed": "3"
                            },
                            "destinationTerminal": {
                                "raw": "TERMINAL 5",
                                "parsed": "5"
                            }
                        }
                    ],
                    "hasPlaneChange": false
                },
                {
                    "segmentNumber": "4",
                    "airline": "AA",
                    "flightNumber": "6174",
                    "legs": [
                        {
                            "departureDate": {
                                "raw": "23NOV",
                                "parsed": "11-23"
                            },
                            "departureAirport": "LHR",
                            "destinationAirport": "BWI",
                            "departureTime": {
                                "raw": "140P",
                                "parsed": "13:40"
                            },
                            "destinationTime": {
                                "raw": "455P",
                                "parsed": "16:55"
                            },
                            "offset": 0,
                            "meals": {
                                "raw": "M",
                                "parsed": [
                                    "MEAL_MEAL"
                                ]
                            },
                            "smoking": false,
                            "aircraft": "787",
                            "flightDuration": "08:15",
                            "miles": "3641",
                            "departureTerminal": {
                                "raw": "TERMINAL 5",
                                "parsed": "5"
                            },
                            "destinationTerminal": {
                                "raw": "",
                                "parsed": null
                            }
                        }
                    ],
                    "hasPlaneChange": false
                }
            ]
        };

        assert.deepEqual(lib.parsers.sabre.ServiceInfoParser.parse(dump), result);
    });
});

