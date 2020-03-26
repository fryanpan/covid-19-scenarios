import React from "react"
import * as d3Format from "d3-format"

import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ComposedChart,
    LineChart, Line, ReferenceLine, ResponsiveContainer
} from 'recharts';

import moment from 'moment';

import { mergeDataArrays } from "../utils/dataUtils" 

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


class MyCommunity extends React.Component {    
    render() {        
        const modelInputs = this.props.modelInputs;
        const scenarios = this.props.modelData;
        const historicalData = this.props.historicalData;
        const currentScenario = scenarios[modelInputs.scenario];

        const percentFormatter = d3Format.format(",.0%");

        /** Keep only days with testing ratios */
        const firstTestIndex = currentScenario.dailyData.findIndex(x => x.testingRatio > 0);
        const testData = currentScenario.dailyData.slice(firstTestIndex, currentScenario.summary.currentDayIndex)

        /** Pull some comparison data for R ratios */
        const WINDOW = 7;
        const currentScenarioName = modelInputs.state;
        const confirmedCasesRatios =
            mergeDataArrays([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedCases', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedCases', WINDOW, 'China (Hubei)')
            ]);

        const deathRatios =
            mergeDataArrays([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedDeaths', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedDeaths', WINDOW, 'China (Hubei)')
            ]);

        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>

            <h2>When might social distancing end?</h2>
            @TODO: Insert a chart here by active cases per million people

            China started reducing restrictions once they were below 10 per million.
            Taiwan never went above this level.

            Link to Bill Gates' estimate of 6-10 weeks for developed nations (I assume his team is doing some exceptional modeling)

            <h2>Are things getting better?</h2>
            <p>
            This chart calculates the number of confirmed deaths over the past week and how it compares to the week before that.
            
            It compares {modelInputs.state} to Hubei in China, where strong flattening measures started on January 24.
            This would have immediately started reducing transmission, but most deaths happen 3 or more weeks
            after contracting the virus.  This is why the new death counts only start moving much lower starting February 19.  
            Eventually, deaths in each week are only 50% of the week before.
            </p>

            <p>
                The key takeaway: if your area has made a major change to flatten the curve, like staying at home
                or much more extensive testing, look for the changes here in the death ratio about 3 weeks later.
                Even better, if deaths each week consistently fall below 100% of the past week, then you have likely 
                flattened below R = 1, and eventually the number of cases will dwindle to zero.
            </p>
            <ResponsiveContainer width={960} height={600}>
                <LineChart
                    data={deathRatios}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis width={100} tickFormatter={percentFormatter} />
                    <Tooltip formatter={percentFormatter}/>
                    <Legend />

                    <ReferenceLine y={1} label="100% means new deaths were the same as the week before" 
                        strokeDasharray="3 3" position="top"/>
                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={3} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={3} dot={false}/>
                </LineChart>
            </ResponsiveContainer>
            <p>
                Note: this chart comes only from the actual confirmed death counts.  It does not use any data from the 
                simulated scenarios.
            </p>

            <h2>How well are we testing?</h2>

            By assuming that the death counts are somewhat accurate, the model can take a guess 
            at how many actual cases there were in the past.  This chart shows the new cases
            daily from the model (when people first show symptoms) vs. the increase in confirmed
            case counts each day from performing tests:

            <ResponsiveContainer width={960} height={300}>
                <ComposedChart
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
                    <Bar dataKey="confirmedCasesInc" fill="#8884d8" />
                    <Line type="linear" dataKey="infectedInc"
                        strokeWidth={2} name="Simulated New Cases"
                        />
                </ComposedChart>
            </ResponsiveContainer>

            And as promised, here is a different chart to avoid doing mental math.  
            Here's the testing ratio, showing the cases confirmed by tests
            as a fraction of simulated new cases:

            <ResponsiveContainer width={960} height={300}>
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
            </ResponsiveContainer>

            <h2>How many people might be infected over time?</h2>
            <ResponsiveContainer width={960} height={300}>
                <AreaChart
                    width={960}
                    height={300}
                    data={currentScenario.dailyData}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis width={100}/>
                    <Tooltip />
                    <Legend />
                    <Area type="linear" dataKey="recovered" strokeWidth={0}
                        name="Recovered" fill="#66c2a5" />
                    <Area type="linear" dataKey="infected" strokeWidth={0}
                        stackId="a"  name = "Infected (has symptoms)" fill="#fc8d62" />
                    <Area type="linear" dataKey="exposed" strokeWidth={0}
                        stackId="a" name = "Infected (no symptoms)" fill="#8da0cb" />
                    <Area type="linear" dataKey="dead" strokeWidth={0}
                        name = "Dead" fill="#e78ac3" />
                </AreaChart>
            </ResponsiveContainer>

            <h2>How many people might die?</h2>
            <ResponsiveContainer width={960} height={300}>
                <AreaChart
                    width={960}
                    height={300}
                    data={currentScenario.dailyData}
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
                    <Area type="step" dataKey="dead" strokeWidth={0}
                        name = "Deaths (from simulation)" fill="#e78ac3" />
                    <Area type="step" dataKey="confirmedDeaths" strokeWidth={0} 
                        name = "Confirmed Deaths" fill="#a6d854" />
                </AreaChart>
            </ResponsiveContainer>

        </div>
    }

}


export default MyCommunity
