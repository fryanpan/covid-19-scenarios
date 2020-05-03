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
    "Santa Clara, California": "San Francisco Metro",
    "Alameda, California": "San Francisco Metro",
    "Napa, California": "San Francisco Metro",
    "Solano, California": "San Francisco Metro",
    "Contra Costa, California": "San Francisco Metro",
    "Marin, California": "San Francisco Metro",
    "San Mateo, California": "San Francisco Metro",
    "San Francisco, California": "San Francisco Metro",
    "Sonoma, California": "San Francisco Metro",

    // Los Angeles
    "Los Angeles, California": "Los Angeles Metro",
    "San Bernardino, California": "Los Angeles Metro",
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
    "Somerset, New Jersey": "New York Metro",

    "Essex, New Jersey": "New York Metro",
    "Union, New Jersey": "New York Metro",
    "Morris, New Jersey": "New York Metro",
    "Sussex, New Jersey": "New York Metro",
    "Hunterdon, New Jersey": "New York Metro",
    "Pike, Pennsylvania": "New York Metro",

    // Chicago
    "Cook, Illinois": "Chicago Metro",
    "DeKalb, Illinois": "Chicago Metro",
    "DuPage, Illinois": "Chicago Metro",
    "Grundy, Illinois": "Chicago Metro",
    "Kane, Illinois": "Chicago Metro",
    "Kendall, Illinois": "Chicago Metro",
    "Lake, Illinois": "Chicago Metro",
    "McHenry, Illinois": "Chicago Metro",
    "Will, Illinois": "Chicago Metro",
    "Jasper, Indiana": "Chicago Metro",
    "Lake, Indiana": "Chicago Metro",
    "Newton, Indiana": "Chicago Metro",
    "Porter, Indiana": "Chicago Metro",
    "Kenosha, Wisconsin": "Chicago Metro",

    // Dallas Fort-Worth
    "Collin, Texas": "Dallas Fort-Worth Metro",
    "Dallas, Texas": "Dallas Fort-Worth Metro",
    "Denton, Texas": "Dallas Fort-Worth Metro",
    "Ellis, Texas": "Dallas Fort-Worth Metro",
    "Hood, Texas": "Dallas Fort-Worth Metro",
    "Hunt, Texas": "Dallas Fort-Worth Metro",
    "Johnson, Texas": "Dallas Fort-Worth Metro",
    "Kaufman, Texas": "Dallas Fort-Worth Metro",
    "Parker, Texas": "Dallas Fort-Worth Metro",
    "Rockwall, Texas": "Dallas Fort-Worth Metro",
    "Somervell, Texas": "Dallas Fort-Worth Metro",
    "Tarrant, Texas": "Dallas Fort-Worth Metro",
    "Wise, Texas": "Dallas Fort-Worth Metro",

    // Houston
    "Austin, Texas": "Houston Metro",
    "Brazoria, Texas": "Houston Metro",
    "Chambers, Texas": "Houston Metro",
    "Fort Bend, Texas": "Houston Metro",
    "Galveston, Texas": "Houston Metro",
    "Harris, Texas": "Houston Metro",
    "Liberty, Texas": "Houston Metro",
    "Montgomery, Texas": "Houston Metro",
    "Waller, Texas": "Houston Metro",

    // Philadelphia
    "New Castle, Delaware": "Philadelphia Metro",
    "Cecil, Maryland": "Philadelphia Metro",
    "Burlington, New Jersey": "Philadelphia Metro",
    "Camden, New Jersey": "Philadelphia Metro",
    "Gloucester, New Jersey": "Philadelphia Metro",
    "Salem, New Jersey": "Philadelphia Metro",
    "Bucks, Pennsylvania": "Philadelphia Metro",
    "Chester, Pennsylvania": "Philadelphia Metro",
    "Delaware, Pennsylvania": "Philadelphia Metro",
    "Montgomery, Pennsylvania": "Philadelphia Metro",
    "Philadelphia, Pennsylvania": "Philadelphia Metro",

    // Washington
    "District of Columbia, District of Columbia": "Washington DC Metro",
    "Calvert, Maryland": "Washington DC Metro",
    "Charles, Maryland": "Washington DC Metro",
    "Frederick, Maryland": "Washington DC Metro",
    "Montgomery, Maryland": "Washington DC Metro",
    "Prince George's, Maryland": "Washington DC Metro",
    "Arlington, Virginia": "Washington DC Metro",
    "Clarke, Virginia": "Washington DC Metro",
    "Culpeper, Virginia": "Washington DC Metro",
    "Fairfax, Virginia": "Washington DC Metro",
    "Fauquier, Virginia": "Washington DC Metro",
    "Loudoun, Virginia": "Washington DC Metro",
    "Prince William, Virginia": "Washington DC Metro",
    "Rappahannock, Virginia": "Washington DC Metro",
    "Spotsylvania, Virginia": "Washington DC Metro",
    "Stafford, Virginia": "Washington DC Metro",
    "Warren, Virginia": "Washington DC Metro",
    "Alexandria, Virginia": "Washington DC Metro",
    "Fairfax City, Virginia": "Washington DC Metro",
    "Falls Church, Virginia": "Washington DC Metro",
    "Fredericksburg, Virginia": "Washington DC Metro",
    "Manassas, Virginia": "Washington DC Metro",
    "Manassas Park, Virginia": "Washington DC Metro",
    "Jefferson, West Virginia": "Washington DC Metro",
    
    // Miami
    "Broward, Florida": "Miami Metro",
    "Miami-Dade, Florida": "Miami Metro",
    "Palm Beach, Florida": "Miami Metro",
    
    // Atlanta
    "Barrow, Georgia": "Atlanta Metro",
    "Bartow, Georgia": "Atlanta Metro",
    "Butts, Georgia": "Atlanta Metro",
    "Carroll, Georgia": "Atlanta Metro",
    "Cherokee, Georgia": "Atlanta Metro",
    "Clayton, Georgia": "Atlanta Metro",
    "Cobb, Georgia": "Atlanta Metro",
    "Coweta, Georgia": "Atlanta Metro",
    "Dawson, Georgia": "Atlanta Metro",
    "DeKalb, Georgia": "Atlanta Metro",
    "Douglas, Georgia": "Atlanta Metro",
    "Fayette, Georgia": "Atlanta Metro",
    "Forsyth, Georgia": "Atlanta Metro",
    "Fulton, Georgia": "Atlanta Metro",
    "Gwinnett, Georgia": "Atlanta Metro",
    "Haralson, Georgia": "Atlanta Metro",
    "Heard, Georgia": "Atlanta Metro",
    "Henry, Georgia": "Atlanta Metro",
    "Jasper, Georgia": "Atlanta Metro",
    "Lamar, Georgia": "Atlanta Metro",
    "Meriwether, Georgia": "Atlanta Metro",
    "Morgan, Georgia": "Atlanta Metro",
    "Newton, Georgia": "Atlanta Metro",
    "Paulding, Georgia": "Atlanta Metro",
    "Pickens, Georgia": "Atlanta Metro",
    "Pike, Georgia": "Atlanta Metro",
    "Rockdale, Georgia": "Atlanta Metro",
    "Spalding, Georgia": "Atlanta Metro",
    "Walton, Georgia": "Atlanta Metro",

    // Boston
    "Essex, Massachusetts": "Boston Metro",
    "Middlesex, Massachusetts": "Boston Metro",
    "Norfolk, Massachusetts": "Boston Metro",
    "Plymouth, Massachusetts": "Boston Metro",
    "Suffolk, Massachusetts": "Boston Metro",
    "Rockingham, New Hampshire": "Boston Metro",
    "Strafford, New Hampshire": "Boston Metro",

    // Phoenix
    "Maricopa, Arizona": "Phoenix Metro",
    "Pinal, Arizona": "Phoenix Metro",

    // Detroit
    "Lapeer, Michigan": "Detroit Metro",
    "Livingston, Michigan": "Detroit Metro",
    "Macomb, Michigan": "Detroit Metro",
    "Oakland, Michigan": "Detroit Metro",
    "St. Clair, Michigan": "Detroit Metro",
    "Wayne, Michigan": "Detroit Metro",

    // Seattle
    "King, Washington": "Seattle Metro",
    "Pierce, Washington": "Seattle Metro",
    "Snohomish, Washington": "Seattle Metro",

    // Minneapolis
    "Anoka, Minnesota": "Minneapolis Metro",
    "Carver, Minnesota": "Minneapolis Metro",
    "Chisago, Minnesota": "Minneapolis Metro",
    "Dakota, Minnesota": "Minneapolis Metro",
    "Hennepin, Minnesota": "Minneapolis Metro",
    "Isanti, Minnesota": "Minneapolis Metro",
    "Le Sueur, Minnesota": "Minneapolis Metro",
    "Mille Lacs, Minnesota": "Minneapolis Metro",
    "Ramsey, Minnesota": "Minneapolis Metro",
    "Scott, Minnesota": "Minneapolis Metro",
    "Sherburne, Minnesota": "Minneapolis Metro",
    "Sibley, Minnesota": "Minneapolis Metro",
    "Washington, Minnesota": "Minneapolis Metro",
    "Wright, Minnesota": "Minneapolis Metro",
    "Pierce, Wisconsin": "Minneapolis Metro",
    "St. Croix, Wisconsin": "Minneapolis Metro",

    // San Diego Metro
    "San Diego, California": "San Diego Metro",

    // Tampa Metro
    "Hernando, Florida": "Tampa Metro",
    "Hillsborough, Florida": "Tampa Metro",
    "Pasco, Florida": "Tampa Metro",
    "Pinellas, Florida": "Tampa Metro",

    // St. Louis Metro
    "Bond, Illinois": "St. Louis Metro",
    "Calhoun, Illinois": "St. Louis Metro",
    "Clinton, Illinois": "St. Louis Metro",
    "Jersey, Illinois": "St. Louis Metro",
    "Macoupin, Illinois": "St. Louis Metro",
    "Madison, Illinois": "St. Louis Metro",
    "Monroe, Illinois": "St. Louis Metro",
    "St. Clair, Illinois": "St. Louis Metro",
    "Franklin, Missouri": "St. Louis Metro",
    "Jefferson, Missouri": "St. Louis Metro",
    "Lincoln, Missouri": "St. Louis Metro",
    "St. Charles, Missouri": "St. Louis Metro",
    "St. Louis City, Missouri": "St. Louis Metro",
    "Warren, Missouri": "St. Louis Metro",
    "St. Louis, Missouri": "St. Louis Metro",

    // Baltimore
    "Anne Arundel, Maryland": "Baltimore Metro",
    "Baltimore, Maryland": "Baltimore Metro",
    "Carroll, Maryland": "Baltimore Metro",
    "Harford, Maryland": "Baltimore Metro",
    "Howard, Maryland": "Baltimore Metro",
    "Queen Anne's, Maryland": "Baltimore Metro",
    "Baltimore City, Maryland": "Baltimore Metro",

    // Denver
    "Adams, Colorado": "Denver Metro",
    "Arapahoe, Colorado": "Denver Metro",
    "Broomfield, Colorado": "Denver Metro",
    "Clear Creek, Colorado": "Denver Metro",
    "Denver, Colorado": "Denver Metro",
    "Douglas, Colorado": "Denver Metro",
    "Elbert, Colorado": "Denver Metro",
    "Gilpin, Colorado": "Denver Metro",
    "Jefferson, Colorado": "Denver Metro",
    "Park, Colorado": "Denver Metro",

    // Charlotte
    "Cabarrus, North Carolina": "Charlotte Metro",
    "Gaston, North Carolina": "Charlotte Metro",
    "Iredell, North Carolina": "Charlotte Metro",
    "Lincoln, North Carolina": "Charlotte Metro",
    "Mecklenburg, North Carolina": "Charlotte Metro",
    "Rowan, North Carolina": "Charlotte Metro",
    "Union, North Carolina": "Charlotte Metro",
    "Chester, South Carolina": "Charlotte Metro",
    "Lancaster, South Carolina": "Charlotte Metro",
    "York, South Carolina": "Charlotte Metro",

    // Pittsburgh
    "Allegheny, Pennsylvania": "Pittsburgh Metro",
    "Armstrong, Pennsylvania": "Pittsburgh Metro",
    "Beaver, Pennsylvania": "Pittsburgh Metro",
    "Butler, Pennsylvania": "Pittsburgh Metro",
    "Fayette, Pennsylvania": "Pittsburgh Metro",
    "Washington, Pennsylvania": "Pittsburgh Metro",
    "Westmoreland, Pennsylvania": "Pittsburgh Metro",

    // Portland
    "Clackamas, Oregon": "Portland Metro",
    "Columbia, Oregon": "Portland Metro",
    "Multnomah, Oregon": "Portland Metro",
    "Washington, Oregon": "Portland Metro",
    "Yamhill, Oregon": "Portland Metro",
    "Clark, Washington": "Portland Metro",
    "Skamania, Washington": "Portland Metro",

    // San Antonio
    "Atascosa, Texas": "San Antonio Metro",
    "Bandera, Texas": "San Antonio Metro",
    "Bexar, Texas": "San Antonio Metro",
    "Comal, Texas": "San Antonio Metro",
    "Guadalupe, Texas": "San Antonio Metro",
    "Kendall, Texas": "San Antonio Metro",
    "Medina, Texas": "San Antonio Metro",
    "Wilson, Texas": "San Antonio Metro",

    // Orlando
    "Lake, Florida": "Orlando Metro",
    "Orange, Florida": "Orlando Metro",
    "Osceola, Florida": "Orlando Metro",
    "Seminole, Florida": "Orlando Metro",

    // Sacramento
    "El Dorado, California": "Sacramento Metro",
    "Placer, California": "Sacramento Metro",
    "Sacramento, California": "Sacramento Metro",
    "Yolo, California": "Sacramento Metro",

    // Cincinnati
    "Dearborn, Indiana": "Cincinnati Metro",
    "Ohio, Indiana": "Cincinnati Metro",
    "Union, Indiana": "Cincinnati Metro",
    "Boone, Kentucky": "Cincinnati Metro",
    "Bracken, Kentucky": "Cincinnati Metro",
    "Campbell, Kentucky": "Cincinnati Metro",
    "Gallatin, Kentucky": "Cincinnati Metro",
    "Grant, Kentucky": "Cincinnati Metro",
    "Kenton, Kentucky": "Cincinnati Metro",
    "Pendleton, Kentucky": "Cincinnati Metro",
    "Brown, Ohio": "Cincinnati Metro",
    "Butler, Ohio": "Cincinnati Metro",
    "Clermont, Ohio": "Cincinnati Metro",
    "Hamilton, Ohio": "Cincinnati Metro",
    "Warren, Ohio": "Cincinnati Metro",

    // Cleveland
    "Cuyahoga, Ohio": "Cleveland Metro",
    "Geauga, Ohio": "Cleveland Metro",
    "Lake, Ohio": "Cleveland Metro",
    "Lorain, Ohio": "Cleveland Metro",
    "Medina, Ohio": "Cleveland Metro",

    // Kansas City
    "Johnson, Kansas": "Kansas City Metro",
    "Leavenworth, Kansas": "Kansas City Metro",
    "Linn, Kansas": "Kansas City Metro",
    "Miami, Kansas": "Kansas City Metro",
    "Wyandotte, Kansas": "Kansas City Metro",
    "Bates, Missouri": "Kansas City Metro",
    "Caldwell, Missouri": "Kansas City Metro",
    "Cass, Missouri": "Kansas City Metro",
    "Clay, Missouri": "Kansas City Metro",
    "Clinton, Missouri": "Kansas City Metro",
    "Jackson, Missouri": "Kansas City Metro",
    "Lafayette, Missouri": "Kansas City Metro",
    "Platte, Missouri": "Kansas City Metro",
    "Ray, Missouri": "Kansas City Metro",

    // Las Vegas
    "Clark, Nevada": "Las Vegas Metro",


    
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
            locationType: entries[0].locationType,
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
            newRow.locationType = 'Country';
            extraRows.push(newRow)

            if(!addedTotal[key]) {
                // process.stderr.write("Adding total for country " + newRow.country + ' ' + newRow.date + '\n');
                addedTotal[key] = true;
            }
        }
    });
    rows = rows.concat(extraRows);
    return groupRowsByCountryAndState(rows);
}

function reallocateRestatedDeaths(rows, number) {
    var lastLocation = "";
    var totalRows = 0;
    var fromStart = true; 

    rows.forEach((row, index) => {
        const rowLocation = row.state + ':' + row.country + ':' + row.admin2;
        if(rowLocation != lastLocation) {
            lastLocation = rowLocation;
            totalRows = 0;
        }

        var reallocAmount = 0;
        if((row.state == 'New York' && (row.date == '2020-04-16' || row.date == '2020-04-17'))) {
            const deathsYesterday = rows[index - 1].confirmedDeaths - rows[index - 2].confirmedDeaths;
            reallocAmount = Math.max(0, row.confirmedDeaths - rows[index - 1].confirmedDeaths - deathsYesterday);          
            fromStart = true;
        }

        if(row.state == 'New York' && row.date == '2020-04-23') {
            const deathsYesterday = rows[index - 1].confirmedDeaths - rows[index - 2].confirmedDeaths;
            reallocAmount = Math.max(0, row.confirmedDeaths - rows[index - 1].confirmedDeaths - deathsYesterday);          
            totalRows = 3;
            fromStart = false;
        }


        if (row.state == 'Hubei' && row.date == '2020-04-17') {
            reallocAmount = row.confirmedDeaths - rows[index - 1].confirmedDeaths;
            fromStart = true;
        }
        
        if (row.country == 'United Kingdom' && row.date == '2020-04-29') {
            const deathsYesterday = rows[index - 1].confirmedDeaths - rows[index - 2].confirmedDeaths;
            reallocAmount = Math.max(0, row.confirmedDeaths - rows[index - 1].confirmedDeaths - deathsYesterday);

            process.stderr.write("UK " + deathsYesterday + " " + reallocAmount + " " + (row.confirmedDeaths - rows[index - 1].confirmedDeaths));
            fromStart = true;
        }

        if(reallocAmount) {
            process.stderr.write(`Reallocating ${row.state} ${row.admin2} ${reallocAmount}\n`)

            const initialDeaths = fromStart ? 0 : rows[index - totalRows - 1].confirmedDeaths;
            var totalDeaths = rows[index - 1].confirmedDeaths - initialDeaths; 
            var ratio = totalDeaths > 0 ? reallocAmount / totalDeaths : 0;
            var finalDelta = 0;


            for(let i = -totalRows; i < 0; ++i) {
                const prevRow = rows[index + i];
                const delta = Math.round((prevRow.confirmedDeaths - initialDeaths) * ratio);
                finalDelta = delta;
                prevRow.confirmedDeaths += delta;
                process.stderr.write(`    ${prevRow.date} ${prevRow.state} ${prevRow.confirmedDeaths} ${delta} ${initialDeaths}\n`);
            }

            process.stderr.write(`    Checksum: ${reallocAmount} should equal ${finalDelta}\n`);

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
                var admin2 = extractAdmin2(x) || '';
                const locationType = (state == 'All') ? 'Country' : 'State';

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
                        admin2: admin2,
                        locationType: locationType,
                        confirmedCases: parseInt(x['Confirmed'] || 0),
                        confirmedDeaths: parseInt(x['Deaths'] || 0),
                        confirmedRecoveries: parseInt(x['Recovered'] || 0),
                        confirmedActive: parseInt(x['Active'] || 0)
                    });
                }


            });
        } catch (e) {
            process.stderr.write("On date" + dateString + e);
        }
    }

    // Reallocate historical data
    rows = rows.sort(rowCmpAdmin2);
    reallocateRestatedDeaths(rows);

    // Add metro rows
    var foundMetro = {};
    const originalLength = rows.length;
    for(let j = 0; j < originalLength; ++j) {
        const row = rows[j];
        const admin2 = row.admin2;
        const state = row.state;

        const metroKey = `${admin2}, ${state}`;
        const metro = METRO_MAP[metroKey];
        foundMetro[metroKey] = true;

        if(metro) {
            rows.push({
                date: row.date,
                country: row.country,
                state: metro,
                locationType: "Metro",
                confirmedCases: row.confirmedCases,
                confirmedDeaths: row.confirmedDeaths,
                confirmedRecoveries: row.confirmedRecoveries,
                confirmedActive: row.confirmedActive
            })
        }   
    }    

    // Do a check
    for(let key of Object.keys(METRO_MAP)) {
        if(!foundMetro[key]) {
            process.stderr.write("Unable to find county " + key + " for metro " + METRO_MAP[key] + "\n");
        }
    }

    // Group together fixed rows
    rows = groupRowsByCountryAndState(rows)

    // Add country-level sums, where needed
    rows = addCountrySums(rows)

    var sortedRows = rows.sort(rowCmp);

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

function rowCmpAdmin2(x, y) {
    const countryCmp = x.country.localeCompare(y.country);
    const stateCmp = x.state.localeCompare(y.state);
    const admin2Cmp = x.admin2.localeCompare(y.admin2);
    const dateCmp = x.date.localeCompare(y.date);

    if(countryCmp != 0) return countryCmp;

    /** Always sort All to the top */
    if(x.state == "All" && y.state != "All") return -1;
    if(y.state == "All" && x.state != "All") return 1;

    if(stateCmp != 0) return stateCmp;
    if(admin2Cmp != 0) return admin2Cmp;
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
