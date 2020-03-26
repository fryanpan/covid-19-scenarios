import { scaleLog } from 'd3-scale';
import * as d3Format from "d3-format"

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

export function readableNumber(x) {
    return d3Format.format(",.2r")(x);
}

export function readableInteger(x) {
    return d3Format.format(",.0r")(x);
}


export const log10Scale = scaleLog().base(10);
