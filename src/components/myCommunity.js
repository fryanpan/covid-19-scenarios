import React from "react"
import {
    XAxis, YAxis, Tooltip, Legend,
    LineChart, Line, ReferenceLine, ResponsiveContainer
} from 'recharts';

import moment from 'moment';

import { mergeDataArrays, readableRatio, readableNumber, readablePercent } from "../utils/dataUtils" 

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
        var value = sumPast !== 0 ? sumNow / sumPast : undefined;

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
        const flatteningStarted = modelInputs.rAfter < 1.96; // @TODO stop doing this messy thing

        /** Keep only days with testing ratios */
        const firstTestIndex = currentScenario.dailyData.findIndex(x => x.testingRatio > 0);
        const testData = currentScenario.dailyData.slice(firstTestIndex, currentScenario.summary.currentDayIndex)

        /** Pull some comparison data for R ratios */
        const WINDOW = 7;
        const currentScenarioName = modelInputs.state === 'All' ? modelInputs.country : modelInputs.state;
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

        console.log("Hubei", scenarios.hubeiStrongFlattening);

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
                when there is a confirmed infection. Every place is different, but in China, social distancing restrictions
            started gradually rolling back when there were less than 100 active infections per million people. 
            </p>
            <p>
                To guess at when social distancing might end, we can look at a few things.
                First, are we stopping the growth in infections? 
                Are we testing well enough?  If testing picks up and contains
                cases more quickly and broadly, then fewer social distancing measures will be needed
                to keep any outbreaks small.
                And if we are doing all of these things, then when might the number of active
                infections be low enough to relax strict distancing measures?
            </p>

            <h3>Are we reducing transmission enough?</h3>

            <p>
                Let's see how new deaths compares week over week in {currentScenarioName}.
                This is plotted below, along  with Hubei province in China for comparison.
                Looking at the data from Hubei, lockdown started on 
                January 24.  Roughly 3 weeks later, after February 19th, new cases and deaths
                slow down and drop below a ratio of 1x.  This means the numbers each 
                week started shrinking instead of growing. 
            </p>
            <p>
                The key takeaway, if you're on lockdown is this: when your community 
                adds stronger measures like strict social distancing or more extensive 
                testing, look to see if deaths start declining three weeks later.
                If the ratio consistently stays below 1x, then congratulations, 
                your community is in one of the supression scenarios instead of growth 
                scenarios.
            </p>

            <h6 className="chartTitle">Ratio of Actual Deaths This Week vs. Last Week</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={deathRatios}
                    margin={{
                        top: 0, right: 0, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis type='number' 
                        tickFormatter={readableRatio(1)} 
                        scale='log' 
                        domain={[0.1, 'auto']}/>
                    <Tooltip formatter={readableRatio(2)}/>
                    <Legend />

                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={4} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={1} dot={false}/>
                    <Line type="linear" dataKey="South Korea" stroke="#66c2a5"  strokeWidth={1} dot={false}/>
                    <ReferenceLine y={1}  
                        strokeDasharray="3 3" position="start"/>
                                            { flatteningStarted &&

                    <ReferenceLine x={moment(currentScenario.scenario.thresholdDate).format("YYYY-MM-DD")}
                        label={"Flattening starts"} />
                }

                </LineChart>
            </ResponsiveContainer>

{/* 
            <h6 className="chartTitle">Ratio of Confirmed Cases This Week vs. Last Week</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={confirmedCasesRatios}
                    margin={{
                        top: 0, right: 0, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis type='number' 
                        tickFormatter={readableRatio(1)}
                        scale='log'
                        domain={[0.01, 'auto']}/>
                    <Tooltip formatter={readableRatio(2)}/>
                    <Legend />

                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={4} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={1} dot={false}/>
                    <Line type="linear" dataKey="South Korea" stroke="#66c2a5"  strokeWidth={1} dot={false}/>
                    <ReferenceLine y={1}
                        strokeDasharray="3 3" position="start"/>
                    { flatteningStarted && 
                        <ReferenceLine x={moment(currentScenario.scenario.thresholdDate).format("YYYY-MM-DD")}
                            label={"Flattening starts in " + currentScenarioName} />
                    }
                </LineChart>
            </ResponsiveContainer> */}

            <p>
                Note: As you may have seen in the scenarios so far, any measures your community puts in place 
                today won't have much effect on new deaths and cases in the next three weeks.  
                Your community's choices in the past have already determined who's currently infected
                and will go on to be hospitalized or die in the next three weeks.  Let this be a call to act quickly, 
                when your community has only a few cases.
            </p>

            <h2>How well are we testing?</h2>

            <p>
            Testing is slow and incomplete in so many places.  Without enough testing,
            it's hard to know who's infected and needs to be quarantined.  So often the best alternative
            is to quarantine everyone.  
            </p>

            <p>Here you can see how your community might be doing on testing.  The chart below compares
                the total infections predicted by your scenario and the actual total confirmed cases.
                Please try different scenarios to see how this changes.
            </p>            
            <p>
                For comparison, also try switching the country at the top to South Korea.  They're likely
                catching around half of their cases.
            </p>

            <h6 className="chartTitle">Total Confirmed Cases as Percentage of Simulated Cases</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={testData}
                    margin={{
                        top: 0, right: 0, left: 0, bottom: 0,
                    }}
                    // barCategoryGap={1}
                    // barGap={0}
                >
                    <XAxis dataKey="date"/>
                    <YAxis tickFormatter={readablePercent(0)} domain={[0,1]} />
                    <Tooltip formatter={readablePercent(2)}/>
                    <Legend />
                    <Line type="linear" dataKey="testingRatio" fill="#8884d8" 
                        name="% of Cases Detected"
                        dot={false}/>
                </LineChart>
            </ResponsiveContainer> 
            
            <h3>When will we be out of the woods?</h3>

            <p>
            If your case counts are falling and testing is comprehensive,
            then your community will start considering what suppression measures to relax
            without risking a large outbreak.
            </p>

            <p>
                So if you're staying at home and want to guess when it might end, we can look 
                at other places that are gradually coming out of lockdown.  Take Hubei, China
                for example where the pandemic started.  When it dropped to somewhere
                around 100 active cases per million people at the end of March, it started loosening restrictions.  
            </p>
            <p>
                Try different scenarios and see when your community might get to that point.
                Bill Gates was <a href="https://www.gatesnotes.com/Health/A-coronavirus-AMA">
                    predicting 6-10 weeks for countries that do a "good job with testing and shut down"</a>
            </p>

            <h6 className="chartTitle">Active Cases Per Million People over Time</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={activeCasesPerMillion}
                    margin={{
                        top: 0, right: 0, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"/>
                    <YAxis type='number' 
                        scale="log"
                        tickFormatter={readableNumber(2)} 
                        domain={[0.1, 'auto']}/>
                    <Tooltip formatter={readableNumber(2)}/>
                    <Legend />

                    <Line type="linear" dataKey={currentScenarioName} stroke="#8da0cb" strokeWidth={4} dot={false}/>
                    <Line type="linear" dataKey="China (Hubei)" stroke="#fc8d62"  strokeWidth={1} dot={false}/>
                    <ReferenceLine y={100} 
                        strokeDasharray="3 3" position="start"/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    }
}

export default MyCommunity
