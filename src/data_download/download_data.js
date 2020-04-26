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
    "occupied Palestinian territories": "Palestinian territories",
    "Palestine": "Palestinian territories",
    "Republic of Korea": "South Korea",
    "Congo (Brazzaville)": "Republic of Congo",
    "Congo (Kinshasa)": "Republic of Congo"
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

METRO_MAP = {
    // San Francisco Metro
    "Santa Clara, California": "San Francisco Bay Area",
    "Alameda, California": "San Francisco Bay Area",
    "Napa, California": "San Francisco Bay Area",
    "Solano, California": "San Francisco Bay Area",
    "Contra Costa, California": "San Francisco Bay Area",
    "Marin, California": "San Francisco Bay Area",
    "San Mateo, California": "San Francisco Bay Area",
    "San Francisco, California": "San Francisco Bay Area",
    "Sonoma, California": "San Francisco Bay Area",

    // Los Angeles
    "Los Angeles, California": "Los Angeles Metro",
    "San Bernadino, California": "Los Angeles Metro",
    "Ventura, California": "Los Angeles Metro",
    "Orange, California": "Los Angeles Metro",
    "Riverside, California": "Los Angeles Metro",

    // New York City
    "New York City, New York": "New York Metro",
    "Westchester, New York": "New York Metro",
    "Putnam, New York": "New York Metro",
    "Rockland, New York": "New York Metro",
    "Bergen, New Jersey": "New York Metro",
    "Hudson, New Jersey": "New York Metro",
    "Passaic, New Jersey": "New York Metro",

    "Suffolk, New York": "New York Metro",
    "Nassau, New York": "New York Metro",

    "Middlesex, New Jersey": "New York Metro",
    "Monmouth, New Jersey": "New York Metro",
    "Ocean, New Jersey": "New York Metro",
    "Sommerset, New Jersey": "New York Metro",

    "Essex, New Jersey": "New York Metro",
    "Union, New Jersey": "New York Metro",
    "Morris, New Jersey": "New York Metro",
    "Sussex, New Jersey": "New York Metro",
    "Hunterdon, New Jersey": "New York Metro",
    "Pike, Pennsylvania": "New York Metro",
}

REALLOCATE_DAYS = {
    "Hubei:China:2020-04-17": 1290, // reallocate all of the deaths -- China restated probable deaths
    "New York:United States:2020-04-16": 2468, // New York changed historical reporting to include probables
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

function extractAdmin2(row) {
    return row['Admin2'];
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
        if(row.locationType == 'Metro') return; // skip metro level data

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

function reallocateRestatedDeaths(rows) {
    var lastLocation = "";
    var totalRows = 0;

    rows.forEach((row, index) => {
        const rowLocation = row.state + ':' + row.country;
        if(rowLocation != lastLocation) {
            lastLocation = rowLocation;
            totalRows = 0;
        }

        const reallocateKey = rowLocation + ':' + row.date;
        const reallocAmount = REALLOCATE_DAYS[reallocateKey];

        if(reallocAmount) {
            var totalDeaths = rows[index - 1].confirmedDeaths;
            var ratio = reallocAmount / totalDeaths;
            var finalDelta = 0;

            for(let i = -totalRows; i < 0; ++i) {
                const prevRow = rows[index + i];
                const delta = Math.round(prevRow.confirmedDeaths * ratio);
                finalDelta = delta;
                prevRow.confirmedDeaths += delta;

            }

        }
        totalRows++;
    });
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
                var admin2 = extractAdmin2(x);
                const locationType = state == 'All' ? 'Country' : 'State';

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
                        locationType: locationType,
                        confirmedCases: x['Confirmed'] || 0,
                        confirmedDeaths: x['Deaths'] || 0,
                        confirmedRecoveries: x['Recovered'] || 0,
                        confirmedActive: x['Active'] || 0
                    });
                }

                const metroKey = `${admin2}, ${state}`;
                const metro = METRO_MAP[metroKey];
                if(METRO_MAP[metroKey]) {
                    rows.push({
                        date: dateString,
                        country: country.trim(),
                        state: metro,
                        locationType: "Metro",
                        confirmedCases: x['Confirmed'] || 0,
                        confirmedDeaths: x['Deaths'] || 0,
                        confirmedRecoveries: x['Recovered'] || 0,
                        confirmedActive: x['Active'] || 0
                    })
                }
            });
        } catch (e) {
            process.stderr.write("On date" + dateString + e);
        }
    }
    // Group together fixed rows
    rows = groupRowsByCountryAndState(rows)
    rows = addCountrySums(rows)

    var sortedRows = rows.sort(rowCmp);
    reallocateRestatedDeaths(sortedRows);

    // Add incremental columns
    var locationIndex = 0;
    for(let i = 0; i < sortedRows.length; ++i) {
        var cur = sortedRows[i];
        var isNew = i === 0 || 
                sortedRows[i].country != sortedRows[i-1].country || 
                sortedRows[i].state != sortedRows[i-1].state;

        if(isNew) {
            locationIndex = 0;
            cur.newCases = cur.confirmedCases;
            cur.newDeaths = cur.confirmedDeaths;
            cur.newRecoveries = cur.confirmedRecoveries;
        } else {
            locationIndex++;
            const last = sortedRows[i-1];
            cur.newCases = Math.max(0, cur.confirmedCases - last.confirmedCases);
            cur.newDeaths = Math.max(0, cur.confirmedDeaths - last.confirmedDeaths);
            cur.newRecoveries = Math.max(0, cur.confirmedRecoveries - last.confirmedRecoveries);

            if(locationIndex >= 7) {
              cur.newCases7dAgo = sortedRows[i-7].newCases; 
              cur.newDeaths7dAgo = sortedRows[i-7].newDeaths; 
              cur.newRecoveries7dAgo = sortedRows[i-7].newRecoveries; 
            }
        }
    }

    return sortedRows;
}

function rowCmp(x, y) {
        const countryCmp = x.country.localeCompare(y.country);
        const stateCmp = x.state.localeCompare(y.state);
        const dateCmp = x.date.localeCompare(y.date);

        if(countryCmp != 0) return countryCmp;

        /** Always sort All to the top */
        if(x.state == "All" && y.state != "All") return -1;
        if(y.state == "All" && x.state != "All") return 1;

        if(stateCmp != 0) return stateCmp;
        return dateCmp;        
}

async function generateData() {
    const data = await downloadFiles();

    /** Write to file */
    const csvStringifier = createCsvStringifier({
        header: [
            {id: 'date', title: 'date'},
            {id: 'country', title: 'country'},
            {id: 'state', title: 'state'},
            {id: 'locationType', title: 'locationType'},
            {id: 'confirmedCases', title: 'confirmedCases'},
            {id: 'confirmedDeaths', title: 'confirmedDeaths'},
            {id: 'confirmedRecoveries', title: 'confirmedRecoveries'},
            {id: 'newCases', title: 'newCases'},
            {id: 'newDeaths', title: 'newDeaths'},
            {id: 'newRecoveries', title: 'newRecoveries'},
            {id: 'newCases7dAgo', title: 'newCases7dAgo'},
            {id: 'newDeaths7dAgo', title: 'newDeaths7dAgo'},
            {id: 'newRecoveries7dAgo', title: 'newRecoveries7dAgo'},
        ]
    });

    process.stdout.write(csvStringifier.getHeaderString());
    console.log(csvStringifier.stringifyRecords(data));
}

generateData();
