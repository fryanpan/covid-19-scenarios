const download = require('download');
const moment = require('moment');
const neatCsv = require('neat-csv');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const lodash = require('lodash');

const BASE_URL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/"

const START_DATE="2020-01-22";

const COUNTRY_FIX_MAP = {
    "US": "United States",
    "UK": "United Kingdom",
    "Mainland China": "China",
    "Taiwan*": "Taiwan",
    "Korea, South": "South Korea",
    "Iran (Islamic Republic of)": "Iran",
    "Gambia, The": "Gambia",
    "The Gambia": "Gambia",
}

// Used to roll up city level counts to states (for some reason data from mid-Feb to early March is by city)
const STATE_FIX_MAP = {
    "US": {
        "AZ": "Arizona",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "FL": "Florida",
        "GA": "Georgia",
        "HI": "Hawaii",
        "IA": "Iowa",
        "IL": "Illinois",
        "IN": "Indiana",
        "KY": "Kentucky",
        "KS": "Kansas",
        "MA": "Massachusetts",
        "MD": "Maryland",
        "MO": "Missouri",
        "MN": "Minnesota",
        "NE": "Nebraska",
        "NC": "North Carolina",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NV": "Nevada",
        "NY": "New York",
        "OR": "Oregon",
        "OK": "Oklahoma",
        "PA": "Pennsylvania",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "TN": "Tennessee",
        "TX": "Texas",
        "UT": "Utah",
        "VA": "Virginia",
        "VT": "Vermont",
        "WA": "Washington",
        "WI": "Wisconsin"
    },
    "Canada": {
        "ON": "Ontario",
        "QC": "Quebec"
    }
}

async function downloadFiles() {
    var now = new Date();
    var rows = [];

    for(let curDate = moment(START_DATE); curDate.isSameOrBefore(now); curDate = curDate.add(1, 'day')) {
        const fileName =  curDate.format("MM-DD-YYYY") + ".csv";
        const url = BASE_URL + fileName;
        const dateString = curDate.format("YYYY-MM-DD");

        try {
            const rawData = await download(url);

            /* Handle some odd whitespace characters by trimming */
            const fileData = await neatCsv(rawData.toString().trim());

            fileData.forEach(x => {
                var country = x['Country/Region'];
                var state = x["Province/State"] || 'All';

                // Special case for HK -- data starts to categorize HK as part of China starting on 3/11
                if(country == "Hong Kong" || country == "Hong Kong SAR") {
                    country = "China",
                    state = "Hong Kong"
                }

                if(country == state) {
                    state = "All";
                }

                // fix the state
                if(STATE_FIX_MAP[country]) {
                    const stateSuffix = state.split(', ')[1];
                    const cleanState = STATE_FIX_MAP[country][stateSuffix];
                    if(cleanState) {
                        state = cleanState;
                    }
                }

                // fix the country
                const cleanCountry = COUNTRY_FIX_MAP[country];
                if(cleanCountry) {
                    country = cleanCountry;
                }


                if(country && state) {
                    rows.push({
                        date: dateString,
                        country: country.trim(),
                        state: state.trim(),
                        confirmedCases: x['Confirmed'] || 0,
                        confirmedDeaths: x['Deaths'] || 0,
                        confirmedRecoveries: x['Recovered'] || 0
                    });
                }
            });
        } catch (e) {
            process.stderr.write("On date", curDate, " error", e.message + '\n');
        }
    }
    // Group together fixed rows
    rows = lodash(rows).groupBy(x => {
            return x.country + '::' + x.state + '::' + x.date;
        })
        .map(entries => {
            var initial = {
                date: entries[0].date,
                country: entries[0].country,
                state: entries[0].state,
                confirmedCases: 0,
                confirmedDeaths: 0,
                confirmedRecoveries: 0
            }

            var result = entries.reduce((prev, cur) => {
                prev.confirmedCases += parseInt(cur.confirmedCases);
                prev.confirmedDeaths += parseInt(cur.confirmedDeaths);
                prev.confirmedRecoveries += parseInt(cur.confirmedRecoveries);
                return prev;
            }, initial)
            return result;
        }).value();

    return rows.sort((x, y) => {
        const countryCmp = x.country.localeCompare(y.country);
        const stateCmp = x.state.localeCompare(y.state);
        const dateCmp = x.date.localeCompare(y.date);

        if(countryCmp != 0) return countryCmp;
        if(stateCmp != 0) return stateCmp;
        return dateCmp;        
    });
}

async function generateData() {
    const data = await downloadFiles();

    /** Write to file */
    const csvStringifier = createCsvStringifier({
        header: [
            {id: 'date', title: 'date'},
            {id: 'country', title: 'country'},
            {id: 'state', title: 'state'},
            {id: 'confirmedCases', title: 'confirmedCases'},
            {id: 'confirmedDeaths', title: 'confirmedDeaths'},
            {id: 'confirmedRecoveries', title: 'confirmedRecoveries'}
        ]
    });

    process.stdout.write(csvStringifier.getHeaderString());
    console.log(csvStringifier.stringifyRecords(data));
}

generateData();
