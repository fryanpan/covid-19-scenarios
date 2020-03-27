import React from "react"
import * as d3Format from "d3-format"

import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ComposedChart,
    LineChart, Line, ReferenceLine, ResponsiveContainer
} from 'recharts';

import moment from 'moment';

import { mergeDataArrays, readableRatio, readableNumber, readablePercent, log10Scale } from "../utils/dataUtils" 

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
    var lastValue = undefined;

    for(let i = window * 2 + 1; i < data.length; ++i) {
        const sumNow = data[i][key] - data[i - window][key];
        const sumPast = data[i - window][key] - data[i - window * 2][key];

        const date = data[i].date;
        const value = sumPast !== 0 ? sumNow / sumPast : undefined;

        if(value && value > 0) {
            lastValue = value
        } else {
            value = lastValue;
        }
        var entry = { date: date };
        entry[outputKey] = value;
        result.push(entry);
    }
    return result;
}

function rollingRatioForState(historicalData, country, state, key, window, outputKey) {
    const stateData = historicalData.filter(x => x.country === country && x.state === state);
    return computeRollingRatio(stateData, key, window, outputKey);
}

function metricPerMillionPopulation(scenarioData, key, outputKey) {
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



class MyCommunity extends React.Component {    
    render() {        
        const modelInputs = this.props.modelInputs;
        const scenarios = this.props.modelData;
        const historicalData = this.props.historicalData;
        const currentScenario = scenarios[modelInputs.scenario];

        /** Keep only days with testing ratios */
        const firstTestIndex = currentScenario.dailyData.findIndex(x => x.testingRatio > 0);
        const testData = currentScenario.dailyData.slice(firstTestIndex, currentScenario.summary.currentDayIndex)

        /** Pull some comparison data for R ratios */
        const WINDOW = 7;
        const currentScenarioName = modelInputs.state == 'All' ? modelInputs.country : modelInputs.state;
        const confirmedCasesRatios =
            mergeDataArrays([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedCases', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedCases', WINDOW, 'China (Hubei)'),
                rollingRatioForState(historicalData, "South Korea", "All", 'confirmedCases', WINDOW, 'South Korea')
            ]);

        const deathRatios =
            mergeDataArrays([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedDeaths', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedDeaths', WINDOW, 'China (Hubei)'),
                rollingRatioForState(historicalData, "South Korea", "All", 'confirmedDeaths', WINDOW, 'South Korea')
            ]);

        /** Current scenario active cases per million */
        const activeCasesPerMillion = 
            mergeDataArrays([
                metricPerMillionPopulation(currentScenario, 'infected', currentScenarioName),
                metricPerMillionPopulation(scenarios["hubeiStrongFlattening"], 'infected', "China (Hubei)")
            ]);
        console.log("Active cases per million", activeCasesPerMillion);

        activeCasesPerMillion.forEach(x => {
            console.log(x);
        })

        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>

            <h2>When might social distancing end?</h2>

            <p>
                We can look for answers in countries that are starting to loosen restrictions, like China,
                Taiwan, and South Korea.
                
                All of these countries reduced active infections to a level low enough that they could depend on 
                extensive testing, contact tracing, and local restrictions to prevent future growth.
                For example, instead of shutting down all schools, Taiwan only shuts down a school
                when there is a confirmed infection. 
            </p>
            <p>
                To guess at when social distancing might end then, we can try to understand two things.
                When might the number of active infections be low enough?  And are we getting there?

            </p>
            <h3>How many active cases are there in my community?</h3>

            Here's what the {currentScenarioName.scenario.name.toLowerCase()} model predicts for active infections
            per million people.  Every place is different, but in China, social distancing restrictions
            started rolling back once there were fewer than 10 active infections per million people. 

            <ResponsiveContainer width={960} height={400}>
                <LineChart
                    data={activeCasesPerMillion}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis type='number' width={100} 
                        scale="log"
                        tickFormatter={readableNumber(2)} 
                        domain={[0.1, 'auto']}/>
                    <Tooltip formatter={readableNumber(2)}/>
                    <Legend />

                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={4} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={1} dot={false}/>
                    <ReferenceLine y={10} label="This is roughly the level when Hubei started relaxing restrictions"
                        strokeDasharray="3 3" position="start"/>
                </LineChart>
            </ResponsiveContainer>

            <h3>Will we get there?</h3>

            <p>The next question is whether there are signs that we will get there.  Remember that every model is wrong.
            What does the data from the real world tell us, even if it's not fully accurate?
            </p>

            <p>
            One good indicator for this whether the announced counts are going down, and by how much?
            This chart shows the number of confirmed deaths over the past week as a ratio of the
            number from one week before that.
            
            It compares {modelInputs.state} to Hubei in China, where strong flattening measures started on January 24.
            This immediately started reducing transmission, but  most COVID-19 deaths happen 3 or more weeks
            after contracting the virus.  This is why the new death counts only start moving much lower starting February 19.  
            Eventually, deaths in each week are only 50% of the week before.
            </p>
            <ResponsiveContainer width={960} height={400}>
                <LineChart
                    data={deathRatios}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis type='number' width={100} 
                        tickFormatter={readableRatio(1)} 
                        scale='log' 
                        domain={[0.1, 'auto']}/>
                    <Tooltip formatter={readableRatio(2)}/>
                    <Legend />

                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={4} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={1} dot={false}/>
                    <Line type="linear" dataKey="South Korea" stroke="#66c2a5"  strokeWidth={1} dot={false}/>
                    <ReferenceLine y={1} label="1x means new deaths this week were the same as a week before" 
                        strokeDasharray="3 3" position="start"/>
                </LineChart>
            </ResponsiveContainer>

            <p>
                The key takeaway: if your area has added stronger flattening measures, like staying at home
                or much more extensive testing, then look for changes in the death ratio about 3 weeks later.
                If the ratio falls consistently well below 1x like in Wuhan, then the number of cases
                and deaths are going down every week instead of up.
            </p>

            <ResponsiveContainer width={960} height={400}>
                <LineChart
                    data={confirmedCasesRatios}
                    margin={{
                        top: 10, right: 30, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis width={100} tickFormatter={readableRatio(1)}  
                        scale='log' domain={[0.01, 'auto']} />
                    <Tooltip formatter={readableRatio(2)}/>
                    <Legend />

                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={4} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={1} dot={false}/>
                    <Line type="linear" dataKey="South Korea" stroke="#66c2a5"  strokeWidth={1} dot={false}/>
                    <ReferenceLine y={1} label="1x means new confirmed cases this week were the same as the week before" 
                        strokeDasharray="3 3" position="start"/>
                </LineChart>
            </ResponsiveContainer>            

            {/* <h2>How well are we testing?</h2>

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
                    <YAxis width={100} tickFormatter={readablePercent(0)} domain={[0,1]} />
                    <Tooltip formatter={readablePercent(0)}/>
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
                    <YAxis width={100} tickFormatter={readablePercent(0)} domain={[0,1]} />
                    <Tooltip formatter={readablePercent(0)}/>
                    <Legend />
                    <Bar type="monotone" dataKey="testingRatio" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer> */}
{/* 
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
            </ResponsiveContainer> */}

        </div>
    }

}


export default MyCommunity
