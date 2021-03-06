const download = require('download');
const moment = require('moment');
const neatCsv = require('neat-csv');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const lodash = require('lodash');
const fs = require('fs');
const path = require('path');

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

        // Columbus, OH Metro
        "Delaware, Ohio": "Columbus, OH Metro",
        "Fairfield, Ohio": "Columbus, OH Metro",
        "Franklin, Ohio": "Columbus, OH Metro",
        "Hocking, Ohio": "Columbus, OH Metro",
        "Licking, Ohio": "Columbus, OH Metro",
        "Madison, Ohio": "Columbus, OH Metro",
        "Morrow, Ohio": "Columbus, OH Metro",
        "Perry, Ohio": "Columbus, OH Metro",
        "Pickaway, Ohio": "Columbus, OH Metro",
        "Union, Ohio": "Columbus, OH Metro",
        // Indianapolis Metro
        "Boone, Indiana": "Indianapolis Metro",
        "Brown, Indiana": "Indianapolis Metro",
        "Hamilton, Indiana": "Indianapolis Metro",
        "Hancock, Indiana": "Indianapolis Metro",
        "Hendricks, Indiana": "Indianapolis Metro",
        "Johnson, Indiana": "Indianapolis Metro",
        "Madison, Indiana": "Indianapolis Metro",
        "Marion, Indiana": "Indianapolis Metro",
        "Morgan, Indiana": "Indianapolis Metro",
        "Putnam, Indiana": "Indianapolis Metro",
        "Shelby, Indiana": "Indianapolis Metro",
        // Austin Metro
        "Bastrop, Texas": "Austin Metro",
        "Caldwell, Texas": "Austin Metro",
        "Hays, Texas": "Austin Metro",
        "Travis, Texas": "Austin Metro",
        "Williamson, Texas": "Austin Metro",
        // Nashville Metro
        "Cannon, Tennessee": "Nashville Metro",
        "Cheatham, Tennessee": "Nashville Metro",
        "Davidson, Tennessee": "Nashville Metro",
        "Dickson, Tennessee": "Nashville Metro",
        "Hickman, Tennessee": "Nashville Metro",
        "Macon, Tennessee": "Nashville Metro",
        "Maury, Tennessee": "Nashville Metro",
        "Robertson, Tennessee": "Nashville Metro",
        "Rutherford, Tennessee": "Nashville Metro",
        "Smith, Tennessee": "Nashville Metro",
        "Sumner, Tennessee": "Nashville Metro",
        "Trousdale, Tennessee": "Nashville Metro",
        "Williamson, Tennessee": "Nashville Metro",
        "Wilson, Tennessee": "Nashville Metro",
        // Virginia Beach Metro
        "Currituck, North Carolina": "Virginia Beach Metro",
        "Gates, North Carolina": "Virginia Beach Metro",
        "Gloucester, Virginia": "Virginia Beach Metro",
        "Isle of Wight, Virginia": "Virginia Beach Metro",
        "James City, Virginia": "Virginia Beach Metro",
        "Mathews, Virginia": "Virginia Beach Metro",
        "York, Virginia": "Virginia Beach Metro",
        "Chesapeake, Virginia": "Virginia Beach Metro",
        "Hampton, Virginia": "Virginia Beach Metro",
        "Newport News, Virginia": "Virginia Beach Metro",
        "Norfolk, Virginia": "Virginia Beach Metro",
        "Poquoson, Virginia": "Virginia Beach Metro",
        "Portsmouth, Virginia": "Virginia Beach Metro",
        "Suffolk, Virginia": "Virginia Beach Metro",
        "Virginia Beach, Virginia": "Virginia Beach Metro",
        "Williamsburg, Virginia": "Virginia Beach Metro",
        // Providence Metro
        "Bristol, Massachusetts": "Providence Metro",
        "Bristol, Rhode Island": "Providence Metro",
        "Kent, Rhode Island": "Providence Metro",
        "Newport, Rhode Island": "Providence Metro",
        "Providence, Rhode Island": "Providence Metro",
        "Washington, Rhode Island": "Providence Metro",
        // Milwaukee Metro
        "Milwaukee, Wisconsin": "Milwaukee Metro",
        "Ozaukee, Wisconsin": "Milwaukee Metro",
        "Washington, Wisconsin": "Milwaukee Metro",
        "Waukesha, Wisconsin": "Milwaukee Metro",
        // Jacksonville Metro
        "Baker, Florida": "Jacksonville Metro",
        "Clay, Florida": "Jacksonville Metro",
        "Duval, Florida": "Jacksonville Metro",
        "Nassau, Florida": "Jacksonville Metro",
        "St. Johns, Florida": "Jacksonville Metro",
        // Memphis Metro
        "Crittenden, Arkansas": "Memphis Metro",
        "Benton, Mississippi": "Memphis Metro",
        "DeSoto, Mississippi": "Memphis Metro",
        "Marshall, Mississippi": "Memphis Metro",
        "Tate, Mississippi": "Memphis Metro",
        "Tunica, Mississippi": "Memphis Metro",
        "Fayette, Tennessee": "Memphis Metro",
        "Shelby, Tennessee": "Memphis Metro",
        "Tipton, Tennessee": "Memphis Metro",
        // Oklahoma City Metro
        "Canadian, Oklahoma": "Oklahoma City Metro",
        "Cleveland, Oklahoma": "Oklahoma City Metro",
        "Grady, Oklahoma": "Oklahoma City Metro",
        "Lincoln, Oklahoma": "Oklahoma City Metro",
        "Logan, Oklahoma": "Oklahoma City Metro",
        "McClain, Oklahoma": "Oklahoma City Metro",
        "Oklahoma, Oklahoma": "Oklahoma City Metro",
        // Raleigh Metro
        "Franklin, North Carolina": "Raleigh Metro",
        "Johnston, North Carolina": "Raleigh Metro",
        "Wake, North Carolina": "Raleigh Metro",
        // Louisville Metro
        "Clark, Indiana": "Louisville Metro",
        "Floyd, Indiana": "Louisville Metro",
        "Harrison, Indiana": "Louisville Metro",
        "Scott, Indiana": "Louisville Metro",
        "Washington, Indiana": "Louisville Metro",
        "Bullitt, Kentucky": "Louisville Metro",
        "Henry, Kentucky": "Louisville Metro",
        "Jefferson, Kentucky": "Louisville Metro",
        "Oldham, Kentucky": "Louisville Metro",
        "Shelby, Kentucky": "Louisville Metro",
        "Spencer, Kentucky": "Louisville Metro",
        "Trimble, Kentucky": "Louisville Metro",
        // Richmond Metro
        "Amelia, Virginia": "Richmond Metro",
        "Caroline, Virginia": "Richmond Metro",
        "Charles City, Virginia": "Richmond Metro",
        "Chesterfield, Virginia": "Richmond Metro",
        "Dinwiddie, Virginia": "Richmond Metro",
        "Goochland, Virginia": "Richmond Metro",
        "Hanover, Virginia": "Richmond Metro",
        "Henrico, Virginia": "Richmond Metro",
        "King William, Virginia": "Richmond Metro",
        "New Kent, Virginia": "Richmond Metro",
        "Powhatan, Virginia": "Richmond Metro",
        "Prince George, Virginia": "Richmond Metro",
        "Sussex, Virginia": "Richmond Metro",
        "Colonial Heights, Virginia": "Richmond Metro",
        "Hopewell, Virginia": "Richmond Metro",
        "Petersburg, Virginia": "Richmond Metro",
        "Richmond City, Virginia": "Richmond Metro",
        // New Orleans Metro
        "Jefferson, Louisiana": "New Orleans Metro",
        "Orleans, Louisiana": "New Orleans Metro",
        "Plaquemines, Louisiana": "New Orleans Metro",
        "St. Bernard, Louisiana": "New Orleans Metro",
        "St. Charles, Louisiana": "New Orleans Metro",
        "St. James, Louisiana": "New Orleans Metro",
        "St. John the Baptist, Louisiana": "New Orleans Metro",
        "St. Tammany, Louisiana": "New Orleans Metro",
        // Hartford Metro
        "Hartford, Connecticut": "Hartford Metro",
        "Middlesex, Connecticut": "Hartford Metro",
        "Tolland, Connecticut": "Hartford Metro",
        // Salt Lake City Metro
        "Salt Lake, Utah": "Salt Lake City Metro",
        "Tooele, Utah": "Salt Lake City Metro",
        // Birmingham Metro
        "Bibb, Alabama": "Birmingham Metro",
        "Blount, Alabama": "Birmingham Metro",
        "Chilton, Alabama": "Birmingham Metro",
        "Jefferson, Alabama": "Birmingham Metro",
        "St. Clair, Alabama": "Birmingham Metro",
        "Shelby, Alabama": "Birmingham Metro",
        "Walker, Alabama": "Birmingham Metro",
        // Buffalo Metro
        "Erie, New York": "Buffalo Metro",
        "Niagara, New York": "Buffalo Metro",
        // Rochester Metro
        "Livingston, New York": "Rochester Metro",
        "Monroe, New York": "Rochester Metro",
        "Ontario, New York": "Rochester Metro",
        "Orleans, New York": "Rochester Metro",
        "Wayne, New York": "Rochester Metro",
        "Yates, New York": "Rochester Metro",
        // Grand Rapids Metro
        "Barry, Michigan": "Grand Rapids Metro",
        "Kent, Michigan": "Grand Rapids Metro",
        "Montcalm, Michigan": "Grand Rapids Metro",
        "Ottawa, Michigan": "Grand Rapids Metro",
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

        // Reallocating states on the day they added probable deaths
        if((row.state == 'New York' && (row.date == '2020-04-16' || row.date == '2020-04-17')) || 
           (row.state == 'Colorado' && row.date == '2020-04-24') || 
           (row.state == 'Louisiana' && row.date == '2020-04-23') || 
           (row.state == 'Ohio' && row.date == '2020-04-29') || 
           (row.state == 'Texas' && row.date == '2020-04-28') || 

           (row.state == 'Connecticut' && row.date == '2020-04-20') || 
           (row.state == 'South Carolina' && row.date == '2020-04-29') || 
           (row.country == 'United Kingdom' && row.date == '2020-04-29'))
        { 
            const deathsYesterday = rows[index - 1].confirmedDeaths - rows[index - 2].confirmedDeaths;
            reallocAmount = Math.max(0, row.confirmedDeaths - rows[index - 1].confirmedDeaths - deathsYesterday);          
            fromStart = true;
        }

        /** New York reported 700 or so extra deaths on 5/6 and 5/7.  Actual deaths were ~250. Unsure when to assign them in time */
        if(row.state == 'New York' && row.date == '2020-05-06') { 
          const deathsYesterday = rows[index - 1].confirmedDeaths - rows[index - 2].confirmedDeaths;
          reallocAmount = Math.max(0, row.confirmedDeaths - rows[index - 1].confirmedDeaths - deathsYesterday * 3);
          fromStart = true;
        }

        if(row.state == 'New York' && row.date == '2020-05-07') { 
          const deathsYesterday = rows[index - 1].confirmedDeaths - rows[index - 2].confirmedDeaths;
          reallocAmount = Math.max(0, row.confirmedDeaths - rows[index - 1].confirmedDeaths - deathsYesterday * 3);
          fromStart = true;
        } 

        // Pennsylvania has reporting issues that are leading to weekly periodic spikes
        // https://www.post-gazette.com/news/health/2020/05/05/covid-19-coronavirus-Allegheny-County-Western-Pennsylvania-deaths-cases-data-pandemic/stories/202005050081
        // But since these should be handled with 7-day rolling measurements later, I'm ignoring

        // Reallocate the probable deaths added to "Unassigned" to Marion county
        if(row.state == 'Indiana' && row.admin2 == "Marion" && row.date == "2020-04-30") {
          row.confirmedDeaths += 107;
          reallocAmount = 107;
          fromStart = true;
        }

        if(row.state == 'Indiana' && row.admin2 == "Unassigned" && row.date == "2020-04-30") {
          row.confirmedDeaths = 0;
          return;
        }

        // Reallocating probable deaths to Carroll
        if(row.state == 'Maryland' && row.admin2 == "Carroll" && row.date == "2020-04-20") {
          row.confirmedDeaths += 97;
          reallocAmount = 97;
          fromStart = true;
        }

        if(row.state == 'Maryland' && row.admin2 == "Unassigned" && row.date == "2020-04-20") {
          row.confirmedDeaths = 0;
          return;
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
                process.stderr.write(`    ${prevRow.state} ${prevRow.admin2} ${prevRow.confirmedDeaths}\n`);
            }

            process.stderr.write(`    Checksum: ${reallocAmount} should equal ${finalDelta}\n`);

        }
        totalRows++;
    });
}

const CACHE_DIR = 'cache';
async function downloadFiles() {
    var now = new Date();
    var rows = [];
    var i = 0; 

    for(let curDate = moment(START_DATE); curDate.isSameOrBefore(now); curDate = curDate.add(1, 'day')) {
        const fileName =  curDate.format("MM-DD-YYYY") + ".csv";
        const url = BASE_URL + fileName;
        const dateString = curDate.format("YYYY-MM-DD");

        try {
            // try reading file first, if it is more than 7 days old
            var rawData;
            const cacheFile = path.resolve(__dirname, CACHE_DIR, fileName);

            process.stderr.write(`Checking ${cacheFile}`);
            if(moment().diff(dateString, 'days') > 7 && fs.existsSync(cacheFile)) {
              process.stderr.write(`Reading ${dateString} from cache file\n`);
              rawData = fs.readFileSync(cacheFile, "UTF-8");  
            } else {
              rawData = await download(url);
              fs.writeFileSync(cacheFile, rawData);
              process.stderr.write(`Downloaded ${dateString} and wrote cache file\n`);
            }

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
            process.stderr.write("On date " + dateString + " " + e + "\n");
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

            if(metroKey == "Orange, California") {
              process.stderr.write("ORANGE!");
              rows.push({
                date: row.date,
                country: row.country,
                state: "Orange County, CA",
                locationType: "Metro",
                confirmedCases: row.confirmedCases,
                confirmedDeaths: row.confirmedDeaths,
                confirmedRecoveries: row.confirmedRecoveries,
                confirmedActive: row.confirmedActive
              })
            }

            if(metro == "San Francisco Metro") {
              county = admin2 + ' County'
              process.stderr.write("\nSF Metro County " + county);
              rows.push({
                date: row.date,
                country: row.country,
                state: county, 
                locationType: "County",
                confirmedCases: row.confirmedCases,
                confirmedDeaths: row.confirmedDeaths,
                confirmedRecoveries: row.confirmedRecoveries,
                confirmedActive: row.confirmedActive
              })
            }
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

            if(locationIndex >= 14) {
              cur.newCases14dAgo = sortedRows[i-14].newCases; 
              cur.newDeaths14dAgo = sortedRows[i-14].newDeaths; 
              cur.newRecoveries14dAgo = sortedRows[i-14].newRecoveries; 
            }

            if(locationIndex >= 21) {
              cur.newCases21dAgo = sortedRows[i-21].newCases; 
              cur.newDeaths21dAgo = sortedRows[i-21].newDeaths; 
              cur.newRecoveries21dAgo = sortedRows[i-21].newRecoveries; 
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
            {id: 'newCases14dAgo', title: 'newCases14dAgo'},
            {id: 'newDeaths14dAgo', title: 'newDeaths14dAgo'},
            {id: 'newRecoveries14dAgo', title: 'newRecoveries14dAgo'},
            {id: 'newCases21dAgo', title: 'newCases21dAgo'},
            {id: 'newDeaths21dAgo', title: 'newDeaths21dAgo'},
            {id: 'newRecoveries21dAgo', title: 'newRecoveries21dAgo'},
        ]
    });

    process.stdout.write(csvStringifier.getHeaderString());
    console.log(csvStringifier.stringifyRecords(data));
}

generateData();
