import React from "react"
import {
    XAxis, YAxis, Tooltip, Legend,
    LineChart, Line, ReferenceLine, ReferenceDot, ResponsiveContainer
} from 'recharts';

import moment from 'moment';

import { mergeDataArrays, readableRatio, readableNumber, readablePercent, 
    listOfMonths, readableMonth } from "../utils/dataUtils" 

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

    componentWillMount() {
        this.width = window.innerWidth;
    }

    render() {        
        const isNarrow = this.width < 600;
        const modelInputs = this.props.modelInputs;
        const scenarios = this.props.modelData;
        const historicalData = this.props.historicalData;
        const currentScenario = scenarios[modelInputs.scenario];
        const flatteningStarted = modelInputs.rAfter < 1.96; // @TODO stop doing this messy thing

        /** Keep only days with testing ratios */
        const firstTestIndex = currentScenario.dailyData.findIndex(x => x.testingRatio > 0 && x.infectedInc > 50);
        const testData = currentScenario.dailyData.slice(firstTestIndex, currentScenario.summary.currentDayIndex)

        /** Pull some comparison data for R ratios */
        const WINDOW = 7;
        const currentScenarioName = modelInputs.state === 'All' ? modelInputs.country : modelInputs.state;

        const predictedDeathRatios = computeRollingRatio(currentScenario.dailyData.slice(currentScenario.summary.currentDayIndex - 28, currentScenario.summary.currentDayIndex + 28), 
            'dead', WINDOW,
            'Your Scenario');

        const deathRatios =
            mergeDataArrays([
                rollingRatioForState(historicalData, modelInputs.country, modelInputs.state, 'confirmedDeaths', WINDOW, currentScenarioName),
                rollingRatioForState(historicalData, "China", "Hubei", 'confirmedDeaths', WINDOW, 'Hubei'),
                rollingRatioForState(historicalData, "South Korea", "All", 'confirmedDeaths', WINDOW, 'South Korea'),
                predictedDeathRatios
            ]);

        /** Current scenario active cases per million */
        var activeCasesPerMillion = 
            mergeDataArrays([
                metricPerMillionPopulation(currentScenario, 'infected', currentScenarioName),
                metricPerMillionPopulation(scenarios["hubeiStrongFlattening"], 'infected', "China (Hubei)")
            ]);

        var lastIndexAbove1 = 0;
        var firstDayBelow100;
        var maxValue;
        for(let i = 0; i < activeCasesPerMillion.length; ++i) {
            const entry = activeCasesPerMillion[i];
            const date = entry.date;
            const value = entry[currentScenarioName];

            if(!maxValue || value > maxValue) {
                maxValue = value;
            }

            if(value < maxValue && value < 100 && !firstDayBelow100) {
                firstDayBelow100 = moment(date).format("YYYY-MM-DD");
            }
            if(value > 1) {
                lastIndexAbove1 = i;
            }
        }

        activeCasesPerMillion = activeCasesPerMillion.slice(0, lastIndexAbove1);

        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>
            <div className="hideable">

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
            </div>

            <h3>Are we reducing transmission enough?</h3>

            <p className="hideable">
                Let's see how new deaths compares week over week in {currentScenarioName}.
                This is plotted below, along  with Hubei province in China for comparison.
                Looking at the data from Hubei, lockdown started on 
                January 24.  Roughly 3 weeks later, after February 19th, new deaths
                slow down and drop below a ratio of 1x.  This means that each week
                has fewer deaths than the week before. 
            </p>

            <h6 className="chartTitle">Ratio of Deaths This Week vs. Last Week</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={deathRatios}
                    margin={{
                        top: 0, right: 0, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"
                        ticks={listOfMonths("2020-01-01", "2020-12-01")}
                        interval={0}
                        tickFormatter={readableMonth}
                    />
                    <YAxis type='number' 
                        tickFormatter={readableRatio(1)} 
                        scale='log' 
                        domain={[0.1, 'auto']}/>
                    <Tooltip formatter={readableRatio(2)}/>
                    <Legend iconType='square' strokeWidth={2} />

                    <Line type="linear" dataKey="Your Scenario" 
                        name={currentScenarioName + " (Scenario)"} stroke="#c4cde4"  strokeWidth={40} dot={false}
                        />
                    <Line type="linear" dataKey={currentScenarioName} 
                        name={currentScenarioName + " (Actual)"} stroke="#8da0cb" strokeWidth={3} dot={false}/>
                    <Line type="linear" dataKey="Hubei"
                        name="Hubei (Actual)" stroke="#fc8d62"  strokeWidth={2} dot={false}/>
                    <Line type="linear" dataKey="South Korea"
                        name="South Korea (Actual)" stroke="#ffd92f"  strokeWidth={2} dot={false}/>
                        />
                    <ReferenceLine y={1}  
                        strokeDasharray="3 3" position="start"/>

                    <ReferenceDot x={"2020-02-19"}
                        y={1.86}
                        r={6}
                        className="hideable"
                     />
                     <ReferenceDot x={"2020-02-19"}
                        className="hideable"
                        y={2.5}
                        r={0}
                        label="Feb 19"
                     />
                                            
                    { flatteningStarted &&
                        <ReferenceLine x={moment(currentScenario.scenario.thresholdDate).format("YYYY-MM-DD")}/>
                    
                    }
                    { flatteningStarted &&
                        <ReferenceDot x={moment(currentScenario.scenario.thresholdDate).format("YYYY-MM-DD")}
                            y={0.25}
                            r={0}
                            label={"Flattening starts"} />
    
                    }
                    
                    { flatteningStarted &&
                            <ReferenceLine x={moment(currentScenario.scenario.thresholdDate).add(3, 'week').format("YYYY-MM-DD")}/>
                    }
                    { flatteningStarted &&
                        <ReferenceDot x={moment(currentScenario.scenario.thresholdDate).add(3, 'week').format("YYYY-MM-DD")}
                            y={0.15}
                            r={0}
                            label={"3 weeks later"} />
    
                    }

                </LineChart>
            </ResponsiveContainer>

            <div className="hideable">
                <p>
                    The key takeaway, if you're on lockdown is this: when your community 
                    adds stronger measures like strict social distancing or more extensive 
                    testing, look to see if deaths start declining three weeks later.
                    If the ratio consistently stays below 1x, then congratulations, 
                    your community is in one of the supression scenarios instead of growth 
                    scenarios.
                </p>

                <p>
                    Also, as you may have seen in the scenarios so far, any measures your community puts in place 
                    today won't have much effect on new deaths and cases in the next 2-3 weeks.  
                    Your community's choices in the past have already determined who's currently infected
                    and will go on to be hospitalized or die in the next three weeks.  Let this be a call to act quickly, 
                    when your community has only a few cases.
                </p>
            </div>


            <h2>How well are we testing?</h2>
            <div className="hideable">

                <p>
                Testing is slow and incomplete in so many places.  Without enough testing,
                it's hard to know who's infected and needs to be quarantined.  So often the best alternative
                is to quarantine everyone.  
                </p>

                <p>Here you can see how your community might be doing on testing.  The chart below compares
                    the number of 
                    new confirmed cases from testing vs. the total new infections predicted by your scenario each day.
                    Note that the chart can briefly go over 100%, if there are delays in testing.  When tests catch up
                    there might be many cases from past weeks confirmed on a single day.
                </p>            
                <p>
                    Please try different scenarios to get a sense for how well your community is testing.
                    For comparison, also try switching the country at the top to South Korea.
                </p>
            </div>

            <h6 className="chartTitle">Confirmed Cases Each Day As Percentage of New Cases From Scenario</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={testData}
                    margin={{
                        top: 0, right: 50, left: 0, bottom: 0,
                    }}
                    // barCategoryGap={1}
                    // barGap={0}
                >

                    <Line type="monotone" dataKey="testingRatio" stroke="#c4cde4" 
                        strokeWidth={30}
                        name="% of Cases Detected"
                        dot={false}/>
                    <XAxis dataKey="date"
                        
                        interval={7}
                        tickFormatter={readableMonth}
                    
                    />
                    <YAxis tickFormatter={readablePercent(0)} domain={[0, max => Math.max(max, 1)]} />
                    <Tooltip formatter={readablePercent(2)}/>
                </LineChart>
            </ResponsiveContainer> 
            
            <h3>When will we be out of the woods?</h3>

            <div className="hideable">
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
                    Try different scenarios and see when your community might be below 100 active cases per million.
                    Bill Gates was <a href="https://www.gatesnotes.com/Health/A-coronavirus-AMA">
                        predicting 6-10 weeks for countries that do a "good job with testing and shut down"</a>
                </p>
            </div>

            <h6 className="chartTitle">Active Cases Per Million People Over Time</h6>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={activeCasesPerMillion}
                    margin={{
                        top: 20, right: 0, left: 0, bottom: 0,
                    }}
                >
                    <XAxis dataKey="date"
                        ticks={listOfMonths("2020-01-01", "2021-12-01")}
                        interval={isNarrow ? 1 : 0}
                        tickFormatter={readableMonth}
                    
                    />
                    <YAxis type='number' 
                        scale="log"
                        tickFormatter={readableNumber(2)} 
                        domain={[0.1, 'auto']}/>
                    <Tooltip formatter={readableNumber(2)}/>
                    <Legend iconType='square' />

                    <Line type="linear" dataKey="China (Hubei)" stroke="#fdcdac"  strokeWidth={isNarrow ? 15 : 30} dot={false}/>
                    <Line type="linear" dataKey={currentScenarioName} stroke="#c4cde4" strokeWidth={isNarrow ? 15 : 30} dot={false}/>
                    <ReferenceLine y={100} 
                        strokeDasharray="3 3" position="start"/>

                    { modelInputs.rAfter < 0.9 &&
                        <ReferenceDot x={firstDayBelow100} y={100} 
                            r={5}></ReferenceDot>
                    }
                    { modelInputs.rAfter < 0.9 &&
                        
                        <ReferenceDot x={moment(firstDayBelow100).add(1.5, 'week').format("YYYY-MM-DD")} 
                            y={200} 
                            r={0}
                            label={readableMonth(firstDayBelow100)}></ReferenceDot>
                    }

                </LineChart>
            </ResponsiveContainer>

            <div className="hideable">
                <h3>Putting it all together</h3>
                <p>
                    The three charts in this section are what I check every few days.  Because there is so much
                    uncertainty and variation from place to place, what matters most is not having the perfect 
                    model.  What matters is being able to tell what scenario best represents what is happening
                    right now in your community to plan and act accordingly.
                </p>
                <p>
                    For example, I live in California, where shelter-at-home started on March 19th. So I will be 
                    looking for whether our week over week death ratios start falling around April 9th.  And I'll
                    look again about a week later, around April 16th to see where they fall to.  That gives 
                    a rough estimate of what R actually is here with social distancing.  Then I can see how the 
                    "when will we be out of the woods" chart looks with those R values.  I will also look
                    for evidence we're testing well.  My local municipalities have been reasonably thoughtful
                    so far.  Plus they'll have better data than I have, so I will be looking for 
                    updates from them in eary to mid-April as well.
                </p>
                <p>
                    I mostly gloss over the news reports of increasing death counts every day.
                    Unfortunately, increasing death counts are what we should expect in an outbreak.
                    More than a month ago, I already wrote down what I would personally do 
                    in each plausible scenario.  What's more interesting to me is knowing
                    what future scenarios are most likely and when we're changing to a different
                    scenario.
                </p>
            </div>
        </div>
    }
}

export default MyCommunity
