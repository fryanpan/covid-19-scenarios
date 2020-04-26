import * as d3Format from "d3-format"
import * as moment from "moment"

/**
 * Takes an array of arrays of objects.
 * array[i][j] = {
 *     date: <date>,
 *     key1:
 * }  
 * 
 * Each subarray is sorted by "date" key.
 * Each subarray may have different keys.
 * 
 * Merges the keys together by date in linear time
 * 
 * @param {*} array 
 */
export function mergeDataArrays(array) {
    var result = array[0].slice();

    for(let i = 1; i < array.length; ++i) { // merge into result
        for(let j = 0, k = 0; j < array[i].length;) {
            const resultElem = result[k];
            const arrayElem = array[i][j];

            if(k < result.length) {
                const resultDate = resultElem.date;
                const arrayDate = arrayElem.date;

                if(arrayDate === resultDate) { // merge the entries
                    Object.assign(resultElem, arrayElem);
                    j++;
                    k++;
                } else if (arrayDate < resultDate) { // insert from array[j]
                    result.splice(k, 0, arrayElem);
                    j++;
                    k++;
                } else { // jDate > kDate -- move along in the result array
                    k++;
                }
            } else {
                result.push(arrayElem);
                j++;
            }
        }
    }
    return result;
}

/**
 * Computes a metric, per million population, in a scenario
 * 
 * @param {Object} scenarioData Result of running a model 
 * @param {String} key String key to use to lookup a metric from each row of the scenario
 * @param {String} outputKey Output key to use
 */
export function metricPerMillionPopulation(scenarioData, key, outputKey) {
    const population = scenarioData.scenario.population;

    return scenarioData.dailyData.map(x => {
        var row = {
            date: x.date
        };
        if(x[key] !== 0) {
            row[outputKey] = x[key] / population * 1000000;
        }
        return row;
    });
}

/**
 * Computes a metric as a fraction of population, in a scenario
 * 
 * @param {Object} scenarioData Result of running a model 
 * @param {String} key String key to use to lookup a metric from each row of the scenario
 * @param {String} outputKey Output key to use
 */
export function metricPopulationRatio(scenarioData, key, outputKey) {
    const population = scenarioData.scenario.population;

    return scenarioData.dailyData.map(x => {
        var row = {
            date: x.date
        };
        if(x[key] !== 0) {
            row[outputKey] = x[key] / population;
        }
        return row;
    });
}

export function readableNumber(precision) {
    precision = precision || 2;
    return d3Format.format(`,.${precision}r`);
}

export function readableRatio(precision) {
    precision = precision || 2;
    const formatter = d3Format.format(`,.${precision}r`);
    return x => formatter(x) + 'x';
}

export function readableInteger() {
    return d3Format.format(`,d`);
}

export function readablePercent(precision) {
    precision = precision || 0;
    return d3Format.format(`,.${precision}p`);
}

export function readableSIPrefix(precision) {
    precision = precision || 2;
    return d3Format.format(`,.${precision}s`);
}

export function readableOdds() {
    const formatter = readableInteger();
    return x => {
        if(x > 0.1) {
            return Math.round(x * 10) + ' in 10'; 
        } else {
            return `1 in ${formatter(1 / x)}`;
        }
    }
}

/**
 * Returns a list of months in YYYY-MM-DD format
 * 
 * @param {*} start 
 * @param {*} end 
 * @returns {String[]} An array of the first day of each month in YYYY-MM-DD format
 */
export function listOfMonths(start, end) {
    var result = [];
    for(let cur = moment(start).startOf('month'); cur.isSameOrBefore(end, 'month'); cur = cur.add(1, 'month')) {
        result.push(cur.format("YYYY-MM-DD"));
    }
    return result;
}

export function readableMonth(x) {
    return moment(x).format("MMM D");

}
