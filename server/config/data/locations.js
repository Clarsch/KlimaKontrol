const locations = [
    {
        id: 'los-angeles',
        name: 'Los Angeles',
        config: {
            groundTemperature: 20,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'san-francisco',
        name: 'San Francisco',
        config: {
            groundTemperature: 15,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'san-diego',
        name: 'San Diego',
        config: {
            groundTemperature: 18,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'sacramento',
        name: 'Sacramento',
        config: {
            groundTemperature: 17,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'san-jose',
        name: 'San Jose',
        config: {
            groundTemperature: 16,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'houston',
        name: 'Houston',
        config: {
            groundTemperature: 22,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'austin',
        name: 'Austin',
        config: {
            groundTemperature: 21,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'dallas',
        name: 'Dallas',
        config: {
            groundTemperature: 20,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'san-antonio',
        name: 'San Antonio',
        config: {
            groundTemperature: 21,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'fort-worth',
        name: 'Fort Worth',
        config: {
            groundTemperature: 20,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'miami',
        name: 'Miami',
        config: {
            groundTemperature: 24,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'orlando',
        name: 'Orlando',
        config: {
            groundTemperature: 23,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'tampa',
        name: 'Tampa',
        config: {
            groundTemperature: 23,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'jacksonville',
        name: 'Jacksonville',
        config: {
            groundTemperature: 22,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'fort-lauderdale',
        name: 'Fort Lauderdale',
        config: {
            groundTemperature: 24,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'new-york-city',
        name: 'New York City',
        config: {
            groundTemperature: 12,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'buffalo',
        name: 'Buffalo',
        config: {
            groundTemperature: 10,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'rochester',
        name: 'Rochester',
        config: {
            groundTemperature: 10,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'syracuse',
        name: 'Syracuse',
        config: {
            groundTemperature: 10,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    },
    {
        id: 'albany',
        name: 'Albany',
        config: {
            groundTemperature: 11,
            thresholds: {
                temperature: {
                    active: true,
                    min: 2,
                    max: 22
                },
                humidity: {
                    active: true,
                    min: 45,
                    max: 65
                },
                airPressure: {
                    active: false,
                    min: 960,
                    max: 1040
                }
            }
        }
    }
];

module.exports = locations; 