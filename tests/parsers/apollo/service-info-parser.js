"use strict";

const assert = require('assert');
const root = require('app-root-path');

const lib = require.main.require(`${root}/index`);

describe('Apollo ServiceInfoParser', () => {
    it('parse Apollo *SVC dump', () => {
        const dump = [
            ' 1 AA 3018  L SMFLAX  ERD  FOOD TO PURCHASE                1:30',
            '                      NON-SMOKING',
            '',
            '           OPERATED BY AMERICAN EAGLE',
            '           DEPARTS SMF TERMINAL B  - ARRIVES LAX TERMINAL 4',
            '           TSA SECURED FLIGHT',
            '',
            ' 2 AA  169  L LAXNRT  777  LUNCH/DINNER                   11:40',
            '                      MOVIE/TELEPHONE/AUDIO PROGRAMMING/',
            '                      DUTY FREE SALES/NON-SMOKING/',
            '                      IN-SEAT POWER SOURCE/VIDEO/LIBRARY',
            '',
            '           DEPARTS LAX TERMINAL 4  - ARRIVES NRT TERMINAL 2',
            '           TSA SECURED FLIGHT',
            '',
            ' 3 JL  745  L NRTMNL  767  MEAL                            4:40',
            '                      NON-SMOKING',
            '',
            '           DEPARTS NRT TERMINAL 2  - ARRIVES MNL TERMINAL 1',
            '',
            ' 4 JL  746  N MNLNRT  767  MEAL                            4:30',
            '                      NON-SMOKING',
            '',
            '           DEPARTS MNL TERMINAL 1  - ARRIVES NRT TERMINAL 2',
            '',
            ' 5 AA  170  N NRTLAX  777  DINNER/BREAKFAST                9:55',
            '                      MOVIE/TELEPHONE/AUDIO PROGRAMMING/',
            '                      DUTY FREE SALES/NON-SMOKING/',
            '                      IN-SEAT POWER SOURCE/VIDEO/LIBRARY',
            '',
            '           DEPARTS NRT TERMINAL 2  - ARRIVES LAX TERMINAL B',
            '           TSA SECURED FLIGHT',
            '',
            ' 6 AA 3075  N LAXSMF  ERD  FOOD TO PURCHASE                1:25',
            '                      NON-SMOKING',
            '',
            '           OPERATED BY AMERICAN EAGLE',
            '           DEPARTS LAX TERMINAL 4  - ARRIVES SMF TERMINAL B',
            '           TSA SECURED FLIGHT',
        ].join("\n");

        const result = [
            {
                "segmentNumber": 1,
                "airline": "AA",
                "flightNumber": "3018",
                "bookingClass": "L",
                "departureTerminal": "B",
                "arrivalTerminal": "4",
                "operatedByText": "OPERATED BY AMERICAN EAGLE",
                "miscInfoLines": [
                    "TSA SECURED FLIGHT"
                ],
                "legs": [
                    {
                        "departureAirport": "SMF",
                        "destinationAirport": "LAX",
                        "aircraft": "ERD",
                        "mealOptions": "FOOD TO PURCHASE",
                        "mealOptionsParsed": [
                            "MEAL_FOOD_TO_PURCHASE"
                        ],
                        "flightDuration": "1:30",
                        "inFlightServicesLines": [
                            "NON-SMOKING"
                        ]
                    }
                ]
            },
            {
                "segmentNumber": 2,
                "airline": "AA",
                "flightNumber": "169",
                "bookingClass": "L",
                "departureTerminal": "4",
                "arrivalTerminal": "2",
                "operatedByText": "",
                "miscInfoLines": [
                    "TSA SECURED FLIGHT"
                ],
                "legs": [
                    {
                        "departureAirport": "LAX",
                        "destinationAirport": "NRT",
                        "aircraft": "777",
                        "mealOptions": "LUNCH/DINNER",
                        "mealOptionsParsed": [
                            "MEAL_LUNCH",
                            "MEAL_DINNER"
                        ],
                        "flightDuration": "11:40",
                        "inFlightServicesLines": [
                            "MOVIE/TELEPHONE/AUDIO PROGRAMMING/",
                            "DUTY FREE SALES/NON-SMOKING/",
                            "IN-SEAT POWER SOURCE/VIDEO/LIBRARY"
                        ]
                    }
                ]
            },
            {
                "segmentNumber": 3,
                "airline": "JL",
                "flightNumber": "745",
                "bookingClass": "L",
                "departureTerminal": "2",
                "arrivalTerminal": "1",
                "operatedByText": "",
                "miscInfoLines": [],
                "legs": [
                    {
                        "departureAirport": "NRT",
                        "destinationAirport": "MNL",
                        "aircraft": "767",
                        "mealOptions": "MEAL",
                        "mealOptionsParsed": [
                            "MEAL_MEAL"
                        ],
                        "flightDuration": "4:40",
                        "inFlightServicesLines": [
                            "NON-SMOKING"
                        ]
                    }
                ]
            },
            {
                "segmentNumber": 4,
                "airline": "JL",
                "flightNumber": "746",
                "bookingClass": "N",
                "departureTerminal": "1",
                "arrivalTerminal": "2",
                "operatedByText": "",
                "miscInfoLines": [],
                "legs": [
                    {
                        "departureAirport": "MNL",
                        "destinationAirport": "NRT",
                        "aircraft": "767",
                        "mealOptions": "MEAL",
                        "mealOptionsParsed": [
                            "MEAL_MEAL"
                        ],
                        "flightDuration": "4:30",
                        "inFlightServicesLines": [
                            "NON-SMOKING"
                        ]
                    }
                ]
            },
            {
                "segmentNumber": 5,
                "airline": "AA",
                "flightNumber": "170",
                "bookingClass": "N",
                "departureTerminal": "2",
                "arrivalTerminal": "B",
                "operatedByText": "",
                "miscInfoLines": [
                    "TSA SECURED FLIGHT"
                ],
                "legs": [
                    {
                        "departureAirport": "NRT",
                        "destinationAirport": "LAX",
                        "aircraft": "777",
                        "mealOptions": "DINNER/BREAKFAST",
                        "mealOptionsParsed": [
                            "MEAL_DINNER",
                            "MEAL_BREAKFAST"
                        ],
                        "flightDuration": "9:55",
                        "inFlightServicesLines": [
                            "MOVIE/TELEPHONE/AUDIO PROGRAMMING/",
                            "DUTY FREE SALES/NON-SMOKING/",
                            "IN-SEAT POWER SOURCE/VIDEO/LIBRARY"
                        ]
                    }
                ]
            },
            {
                "segmentNumber": 6,
                "airline": "AA",
                "flightNumber": "3075",
                "bookingClass": "N",
                "departureTerminal": "4",
                "arrivalTerminal": "B",
                "operatedByText": "OPERATED BY AMERICAN EAGLE",
                "miscInfoLines": [
                    "TSA SECURED FLIGHT"
                ],
                "legs": [
                    {
                        "departureAirport": "LAX",
                        "destinationAirport": "SMF",
                        "aircraft": "ERD",
                        "mealOptions": "FOOD TO PURCHASE",
                        "mealOptionsParsed": [
                            "MEAL_FOOD_TO_PURCHASE"
                        ],
                        "flightDuration": "1:25",
                        "inFlightServicesLines": [
                            "NON-SMOKING"
                        ]
                    }
                ]
            }
        ];

        assert.deepEqual(lib.parsers.apollo.ServiceInfoParser.parse(dump), result);
    });
});