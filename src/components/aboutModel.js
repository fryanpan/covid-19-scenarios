import React from "react"
import ScenarioEditingComponent from "./scenarioEditingComponent"

import {
    ComposedChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer
} from 'recharts';

import { PresetScenarios, PresetCategories } from '../utils/model'
import * as moment from 'moment'
import { mergeDataArrays, readableInteger } from '../utils/dataUtils'

/**
 * Extracts the date field and one key from each object in an array.
 * Used for pulling out data from multiple simulatios and combining them.
 * 
 * @param {Object[]} array Array of objects  
 * @param {String} key Key to extract from the object 
 * @param {String} outputKey Key to use on the output object
 */
function extractDateAndKey(array, key, outputKey) {
    return array.map(x => {
        var result = {
            date: x.date
        };
        result[outputKey] = x[key];
        return result;
    });
}

class AboutModel extends ScenarioEditingComponent {    
    constructor(props) {
        super(props)
        this.state = {
            modelInputs: this.props.modelInputs,
            showDetails: false
        };
    }

    handleToggleDetails() {
        this.setState(prevState => {
            return {
                showDetails: !prevState.showDetails 
            }
        })
    }

    render() {        
        const scenarios = this.props.modelData;
        const modelInputs = this.props.modelInputs;
        const chosenScenario = modelInputs.scenario;

        const yourLocation = modelInputs.state == 'All' ? modelInputs.country : modelInputs.state;

        /**
         * Combine data from all of the scenarios
         */
        var infectedDataArrays = [];
        var deadDataArrays = [];
        for(let [key, scenarioData] of PresetScenarios.entries()) {
            if(scenarioData.category != PresetCategories.BASIC) continue;

            infectedDataArrays.push(
                extractDateAndKey(scenarios[key].dailyData, 'infectedInc', key + 'InfectedInc')
            );
            deadDataArrays.push(
                extractDateAndKey(scenarios[key].dailyData, 'deadInc', key + 'DeadInc')
            )
        }
        infectedDataArrays.push(
            extractDateAndKey(scenarios.strongFlattening.dailyData, 'confirmedCasesInc', 'confirmedCasesInc')
        )

        deadDataArrays.push(
            extractDateAndKey(scenarios.strongFlattening.dailyData, 'confirmedDeathsInc', 'confirmedDeathsInc')
        )

        const thresholdDayIndex = scenarios.strongFlattening.summary.thresholdDayIndex;
        const scenarioInfectedData = mergeDataArrays(infectedDataArrays);
        const scenarioInfectedDataTillNow = scenarioInfectedData.slice(0, thresholdDayIndex + 15);
        
        const scenarioDeathData = mergeDataArrays(deadDataArrays);
        const scenarioDeathDataTillNow = scenarioDeathData.slice(0, thresholdDayIndex + 28);

        return <div>
            <h1> About the scenarios </h1>
                <p>
                    We're inundated with different analyses.  So many numbers and opinions with so much uncertainty.  
                    Most countries with outbreaks are not testing quickly or comprehensively, so their confirmed 
                    cases are low.  As of March 24th, for example,
                    a survey of experts in the US estimated <a href="https://fivethirtyeight.com/features/experts-say-the-coronavirus-outlook-has-worsened-but-the-trajectory-is-still-unclear/">
                    the official count only includes 9% of actual cases</a>.
                </p>
                <p>
                    However, the worldwide efforts to research and share knowledge
                    are also amazing to watch. At this point there is so much we don't know,
                    yet humanity has discovered more than enough to make headway.
                </p>
                <p>
                    On this page I want to take what we know and aim for accuracy, even under uncertainty. This is why all of the scenarios
                    here start from the confirmed deaths in {yourLocation}. From there we can estimate 
                    how many people might have contracted the virus 3 weeks or so before each death.  Then
                    we can model transmission and predict how the virus spreads.  Since many countries focus 
                    testing on the most severe cases, confirmed deaths are likely more accurate than confirmed cases.             
                </p>
                <p>
                    I also want to acknowledge how much is unknown.  This is why the page lets you try out
                    different scenarios based on the achievable possibilities we've already seen 
                    in different countries around the world.
                </p>

                <p>
                    Please remember that <a href="https://en.wikipedia.org/wiki/All_models_are_wrong">
                    "all models are wrong, but some are useful"</a>.  Rely on your local authorities
                    for the most accurate and up-to-date information.  Hopefully this site helps give you useful context.
                </p>


                <h2>
                    The Scenarios
                </h2>

                <p>
                    On this page, you can choose your own scenario based on how much you think your community
                    can control transmission.  In other words, how much you think you can "flatten the curve"
                    or "plank the curve."  This page offers you the entire range
                    of possibilities seen in the real world so far.  This ranges from models that simulate
                    extensive suppression measures (lockdown at home, extensive testing, contact tracing)
                    to models that simulate the level of uncontrolled growth in places like Iran, 
                    which outpaced even the uncontrolled growth in Wuhan.
                </p>

                <p>          
                   { !this.state.showDetails &&
                        <span>For more details about the scenarios, please <a onClick={this.handleToggleDetails.bind(this)}>
                            click here to show more</a>&nbsp;
                        </span>
                    }
                    { this.state.showDetails && 
                        <span><a onClick={this.handleToggleDetails.bind(this)}>Click here</a> to hide the details</span>
                    }
                </p>     
                { this.state.showDetails && 
                    <div>

                        <p>
                            <a href="https://www.nytimes.com/2020/03/11/science/coronavirus-curve-mitigation-infection.html">
                                    Flattening </a> is the idea that we can slow the transmission of the virus
                                to reduce the peak number of cases.  Each location might choose different
                                measures depending on what works well there and what the economic and social tradeoffs are.
                                In general, social distancing, effective testing, and better contact tracing are all
                                likely to be effective.  But there is no 100% correct answer. 

                        </p>
                        <p>
                                For example, California recommends people stay at home and avoid being within 6 feet 
                                of anyone not from their household.  Taiwan used mobile phones to help track the location
                                of people who have the virus.  In Israel, my family-in-law tells me that people are now 
                                limited to walking no more than 100 metres from home for exercise -- too many people
                                went to the beach.
                        </p>
                        <p>
                                These are the four flattening scenarios we look at through the rest of this page:
                        </p>

                        <ul>
                            <li>
                                <b>Strong Flattening</b> Strong measures.  Based on R from Wuhan after January 24, 2020 
                                    (R = {scenarios.strongFlattening.scenario.rAfter}).
                                </li>
                            <li>
                                <b>Moderate Flattening</b> Moderately effective flattening measures.
                                    (R = {scenarios.moderateFlattening.scenario.rAfter})  
                            </li>
                            <li>
                                <b>Mild Flattening</b> Reduce spread, but not enough to avoid continued growth.
                                    Similar to the first few weeks in South Korea, before there was enough testing
                                    and tracing.
                                    (R = {scenarios.mildFlattening.scenario.rAfter})
                            </li>   
                            <li>
                                <b>No Flattening</b> Minimal to no action taken to reduce transmission.
                                    This is based on data from the initial weeks in China.
                                    (R = {scenarios.noFlattening.scenario.rAfter})
                            </li>   
                        </ul>

                        <p>
                            The key point to flattening measures is how much they reduce the <i>basic reproduction number</i> or <i>R</i>.
                            This number represents for each person who is infected, how many other people on average
                            do they infect.  When it is more than 1, then eventually a large percentage of the population
                            will be infected.  If it less than 1, then a much smaller percentage of the population will be infected.
                        </p>
                        <p>
                            For example, let's take the chart above and zoom out to new deaths each day for the next year.
                            Now, the strong and moderate flattening scenarios
                            are barely visible.  If you can keep R less than 1, it makes a significant difference.
                        </p>
                        <ResponsiveContainer width="100%" height={500}>
                            <ComposedChart
                                data={scenarioDeathData}
                                margin={{
                                    top: 10, right: 100, left: 0, bottom: 20,
                                }}
                            >
                                <XAxis dataKey="date" />                        
                                <YAxis type="number" width={100} />
                                <Legend/>
                                {/* <Tooltip formatter={readableInteger()}/> */}

                                <Line type="linear" dataKey="strongFlatteningDeadInc"  
                                    name="Strong Flattening" stroke="#66c2a5" 
                                    strokeWidth={chosenScenario == "strongFlattening" ? 4 : 1} dot={false}/>

                                <Line type="linear" dataKey="moderateFlatteningDeadInc"  
                                    name="Moderate Flattening" stroke="#fc8d62" 
                                    strokeWidth={chosenScenario == "moderateFlattening" ? 4 : 1} dot={false}/>

                                <Line type="linear" dataKey="mildFlatteningDeadInc"  
                                    name="Mild Flattening" stroke="#8da0cb" 
                                    strokeWidth={chosenScenario == "mildFlattening" ? 4 : 1} dot={false}/>

                                <Line type="linear" dataKey="noFlatteningDeadInc"  
                                    name="No Flattening" stroke="#e78ac3" 
                                    strokeWidth={chosenScenario == "noFlattening" ? 4 : 1} dot={false}/>
                            </ComposedChart>
                        </ResponsiveContainer>                
    
                    </div>
                }

                <h3>Choose your scenario</h3>
                <p>
                    Each scenario here is tuned to the actual historical deaths and total population
                    from {yourLocation}. The chart below shows the confirmed deaths from the&nbsp; 
                    <a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins CSSE Dashboard</a>.
                    Plotted on top are the new deaths predicted daily by each of the four scenarios. 
                </p>
                
                <h6 class="chartTitle">Actual vs. Predicted Deaths Each Day in Your Scenario</h6>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart
                        data={scenarioDeathDataTillNow}
                        margin={{
                            top: 0, right: 0, left: 0, bottom: 0,
                        }}
                    >
                        <XAxis dataKey="date"/>                        
                        <YAxis type="number" />
                        <Tooltip/>
                        <Legend/>

                        <Line type="monotone" dataKey="strongFlatteningDeadInc"  
                            name="Strong Flattening" stroke="#66c2a5" 
                            strokeWidth={chosenScenario == "strongFlattening" ? 4 : 1} dot={false}/>

                        <Line type="monotone" dataKey="moderateFlatteningDeadInc"  
                            name="Moderate Flattening" stroke="#fc8d62" 
                            strokeWidth={chosenScenario == "moderateFlattening" ? 4 : 1} dot={false}/>

                        <Line type="monotone" dataKey="mildFlatteningDeadInc"  
                            name="Mild Flattening" stroke="#8da0cb" 
                            strokeWidth={chosenScenario == "mildFlattening" ? 4 : 1} dot={false}/>

                        <Line type="monotone" dataKey="noFlatteningDeadInc"  
                            name="No Flattening" stroke="#e78ac3" 
                            strokeWidth={chosenScenario == "noFlattening" ? 4 : 1} dot={false}/>

                        <Bar dataKey="confirmedDeathsInc"
                            name="Actual Deaths" fill="#f00"/>
                    </ComposedChart>
                </ResponsiveContainer>

                <p>
                    Please choose a scenario to use as we answer questions on this page: 
                    <select name="scenario" value={modelInputs.scenario} onChange={this.handleScenarioEditEvent}>
                        {
                            [...PresetScenarios.entries()].map(entry => {
                                const key = entry[0];
                                const scenarioData = entry[1];
                                if(scenarioData.category == PresetCategories.BASIC) {
                                    return <option key={key} value={key}>{scenarioData.name}</option>
                                } else {
                                    return "";
                                }
                            })
                        }
                    </select>
                    { modelInputs.scenario != "noFlattening" && 
                        <span>
                            <br/>Flattening measures&nbsp;
                            { moment(modelInputs.flatteningDate).isBefore(new Date(), 'day') ? "started" : "will start" } 
                            &nbsp; on &nbsp;
                            <input style={{width: "8rem"}} type="date" name="flatteningDate"
                                                    value={ modelInputs.flatteningDate.toISOString().split('T')[0]}
                                                    onChange={this.handleScenarioEditEvent}></input>
                            &nbsp;(for example, the day lockdown or shelter-at-home started)
                        </span>
                    }
                </p>
                <p>
                    { modelInputs.scenario == "strongFlattening" &&
                      <span>
                        This strong flattening scenario shows what happens with extensive measures to reduce transmission.
                        This includes strict social distancing (staying at home),
                        extensive testing, rapid contact tracing, and other measures.  After infections
                        are under control, social distancing measures gradually ease, 
                        with targeted lockdowns when testing detects local outbreaks. 
                        The rate of transmission in this scenario is based on what happened in Wuhan after lockdown on January 24, 2020.
                      </span>
                    }
                    { modelInputs.scenario == "moderateFlattening" &&
                      <span>
                        The moderate flattening scenario shows what happens with many measures in place to reduce transmission,
                        but not quite as strongly as in Wuhan after the lockdown.  
                      </span>
                    }
                    { modelInputs.scenario == "mildFlattening" &&
                      <span>
                        The mild flattening scenario shows what happens with some measures in place to reduce transmission, 
                        but not enough measures to prevent the number of cases to continue growing.
                      </span>
                    }
                    { modelInputs.scenario == "noFlattening" &&
                      <span>
                        The no flattening scenario shows what happens with uncontrolled transmission.  The rate of 
                        transmission in this scenario is based on historical data from Wuhan before
                        the lockdown happened on January 24, 2020.
                      </span>
                    }
                </p>
                <p>
                    Anywhere else on the page, you can change the scenario using the bar up top.
                    @TODO Make the bar a little less janky...
                </p>
                   


                

        </div>
    }

}


export default AboutModel
