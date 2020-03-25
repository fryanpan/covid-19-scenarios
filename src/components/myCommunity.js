import React from "react"
import * as d3Format from "d3-format"

import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, ReferenceLine
} from 'recharts';

import moment from 'moment';

function sum(array, key, i, j) {
    var result = 0;
    for(let k = i; k <= j; ++k) {
        result += parseFloat(array[k][key]);
    }
    return result;
}

/** Computes a ratio of past counts for the given key
 * To a period one window length earlier.
 * 
 * Assumes data is given as cumulative counts.
 */
function computeRollingRatio(data, key, window, outputKey) {
    var result = [];

    for(let i = window * 2 + 1; i < data.length; ++i) {
        const sumNow = data[i][key] - data[i - window][key];
        const sumPast = data[i - window][key] - data[i - window * 2][key];
        const date = data[i].date;
        const value = sumPast !== 0 ? sumNow / sumPast : undefined;
        if(value && value > 0) {
            var entry = { date: date };
            entry[outputKey] = value;
            result.push(entry);
        }
    }
    return result;
}

function rollingRatioForState(historicalData, country, state, key, window, outputKey) {
    const stateData = historicalData.filter(x => x.country === country && x.state === state);
    return computeRollingRatio(stateData, key, window, outputKey);
}

function mergeRollingRatios(array) {
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


class MyCommunity extends React.Component {    
    render() {        
        const modelInputs = this.props.modelInputs;
        const scenarios = this.props.modelData;
        const historicalData = this.props.historicalData;

        const percentFormatter = d3Format.format(",.0%");

        /** Keep only days with testing ratios */
        const firstTestIndex = scenarios.current.dailyData.findIndex(x => x.testingRatio > 0);
        const testData = scenarios.current.dailyData.slice(firstTestIndex, scenarios.current.summary.currentDayIndex)

        /** Pull some comparison data for R ratios */
        const WINDOW = 7;
        const currentScenarioName = modelInputs.country + " (" + modelInputs.state + ")";
        const confirmedCasesRatios =
            mergeRollingRatios([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedCases', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "South Korea", "All", 'confirmedCases', WINDOW, 'South Korea'),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedCases', WINDOW, 'China (Hubei)')
            ]);

        const deathRatios =
            mergeRollingRatios([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedDeaths', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "South Korea", "All", 'confirmedDeaths', WINDOW, 'South Korea'),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedDeaths', WINDOW, 'China (Hubei)')
            ]);

        console.log(confirmedCasesRatios, deathRatios);

        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>

            <h2>How many people might be exposed?</h2>
            <AreaChart
                width={960}
                height={300}
                data={scenarios.current.dailyData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
            >
                <XAxis dataKey="date"/>
                <YAxis width={100}/>
                <Tooltip />
                <Legend />
                <Area type="linear" dataKey="recovered"  fill="#8884d8" />
                <Area type="linear" dataKey="infected"  fill="#82ca9d" />
                <Area type="linear" dataKey="exposed" fill="#8884d8" />
                <Area type="linear" dataKey="dead" fill="#8884d8" />
            </AreaChart>

            <h2>How many people might die?</h2>
            <AreaChart
                width={960}
                height={300}
                data={scenarios.current.dailyData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
                // barCategoryGap={1}
                // barGap={0}
            >
                <XAxis dataKey="date"/>
                <YAxis width={100} />
                <Tooltip />
                <Legend />
                <Area type="step" dataKey="dead" fill="#8884d8" />
                <Area type="step" dataKey="confirmedDeaths" fill="#82ca9d" />
            </AreaChart>

            <h2>How well are we testing?</h2>


            <BarChart
                width={960}
                height={300}
                data={testData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
                // barCategoryGap={1}
                // barGap={0}
            >
                <XAxis dataKey="date"/>
                <YAxis width={100} tickFormatter={percentFormatter} domain={[0,1]} />
                <Tooltip formatter={percentFormatter}/>
                <Legend />
                <Bar type="monotone" dataKey="testingRatio" fill="#8884d8" />
            </BarChart>

            <h2>How can I tell if social distancing is working?</h2>

            If social distancing is working, then 

            <h3>How do current deaths compare to past deaths?</h3>
            <p>
            This chart calculates the number of deaths in the three days before each date 
            and then calculates the ratio with the three days before that. 
            </p>
            <LineChart
                width={960}
                height={600}
                data={deathRatios}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
            >
                <XAxis dataKey="date"/>
                <YAxis />
                <Tooltip />
                <Legend />

                <ReferenceLine y={1} label="R = 1" strokeDasharray="3 3" />
                <Line type="linear" dataKey={currentScenarioName} stroke="#66c2a5" strokeWidth={2} dot={false}/>
                <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={2} dot={false}/>
                <Line type="linear" dataKey="South Korea" stroke="#8da0cb" strokeWidth={2} dot={false}/>
            </LineChart>

            <h3>How do current case counts compare to past counts?</h3>
            <p>
            This chart calculates the number of deaths in the three days before each date 
            and then calculates the ratio with the three days before that. 
            </p>
            <LineChart
                width={960}
                height={600}
                data={confirmedCasesRatios}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}>
                <XAxis dataKey="date"/>
                <YAxis type="number" domain={[0, 5]}/>
                <Tooltip />
                <Legend />

                <ReferenceLine y={1} label="R = 1" strokeDasharray="3 3" />

                <Line type="linear" dataKey={currentScenarioName} stroke="#66c2a5" strokeWidth={2} dot={false}/>
                <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62" strokeWidth={2}  dot={false}/>
                <Line type="linear" dataKey="South Korea" stroke="#8da0cb" strokeWidth={2} dot={false}/>
            </LineChart>

            <h2>When might social distancing end?</h2>


            <h3>Comparison with other countries</h3>
        </div>
    }

}


export default MyCommunity
