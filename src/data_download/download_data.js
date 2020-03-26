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

function groupRowsByCountryAndState(rows) {
    return lodash(rows).groupBy(x => {
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
}

/** On March 23, JHU added city-level data in the US and changed schema */
function extractCountry(row) {
    return row['Country/Region'] || row['Country_Region'];
}

function extractState(row) {
    return row['Province/State'] || row['Province_State'];
}


function addCountrySums(rows) {
    process.stderr.write("addCountrySums\n");
    // Identify countries that are missing totals on particular days
    var hasTotal = {};
    var addedTotal = {};
    rows.forEach(row => {
        if(row.state == 'All') {
            const key = row.country + "::" + row.date;
            hasTotal[key] = true;
        }
    });

    // Add to total for any days that are missing
    var extraRows = [];
    rows.forEach(row => {
        const key = row.country + "::" + row.date;

        if(!hasTotal[key]) {
            var newRow = lodash.clone(row);
            newRow.state = 'All';
            extraRows.push(newRow)

            if(!addedTotal[key]) {
                process.stderr.write("Adding total for country " + newRow.country + '\n');
                addedTotal[key] = true;
            }
        }
    });
    rows = rows.concat(extraRows);
    return groupRowsByCountryAndState(rows);
}

async function downloadFiles() {
    var now = new Date();
    var rows = [];
    var i = 0; 

    for(let curDate = moment(START_DATE); curDate.isSameOrBefore(now); curDate = curDate.add(1, 'day')) {
        const fileName =  curDate.format("MM-DD-YYYY") + ".csv";
        const url = BASE_URL + fileName;
        const dateString = curDate.format("YYYY-MM-DD");

        try {
            const rawData = await download(url);

            /* Handle some odd whitespace characters by trimming */
            const fileData = await neatCsv(rawData.toString().trim());

            fileData.forEach(x => {
                var country = extractCountry(x);
                var state = extractState(x) || 'All';

                // Special case for HK -- data starts to categorize HK as part of China starting on 3/11
                if(country == "Hong Kong" || country == "Hong Kong SAR") {
                    country = "China",
                    state = "Hong Kong"
                }

                // Special case for US - bad data on a few days
                if(dateString >= "2020-03-18" && dateString <= "2020-03-22" && country == "US" && state == "US") {
                    return; // skip these rows
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
                        confirmedRecoveries: x['Recovered'] || 0,
                        confirmedActive: x['Active'] || 0
                    });
                }
            });
        } catch (e) {
            process.stderr.write("On date" + dateString + e);
        }
    }
    // Group together fixed rows
    rows = groupRowsByCountryAndState(rows)
    rows = addCountrySums(rows)

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