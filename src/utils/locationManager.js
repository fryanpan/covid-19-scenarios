import * as lodash from "lodash"

/** Manages data about available locations */

/** There's a single instance of the location manager that helps do location lookups */
export class LocationManager {
    /**
     * Initialize with the contents of the locations.csv file
     * 
     * @param {Object{}} locationData 
     */
    static initLocationData(locationData, covidData) {
        var stateHasData = {};
        covidData.forEach(x => {
            const {country, state} = x;
            if(!stateHasData[country]) {
                stateHasData[country] = {}
            }
            stateHasData[country][state] = true;
        })


        var hidden = [];
        this.locations = locationData.filter(({ country, state }) => {
            const hasCountryData = stateHasData[country];
            const hasData = hasCountryData && stateHasData[country][state];

            if(!hasData) {
                hidden.push(country + " " + state);
                return false;
            } else {
                return true;
            }
        });
        console.log("Hide locations ", hidden);
        this.locations.forEach(x => {
            x.population = x.population ? parseFloat(x.population) : undefined;
            x.rInitial = x.rInitial ? parseFloat(x.rInitial) : undefined;
            x.cfrInitial = x.cfrInitial ? parseFloat(x.rInitial) : undefined;
        })

        this.distinctCountries = lodash(this.locations).map(x => x.country).uniq().value();
    }

    /** Returns a list of locations for a given country 
     * 
     * @returns {Object[]} An array of location objects from the CSV file
    */
    static locationsForCountry(country) {
        return this.locations.filter(x => x.country === country);
    }

    /** Returns the location data for a given country and state */
    static lookupLocation(country, state) {
        return this.locationsForCountry(country)
            .find(x => x.state === state);

    }
}