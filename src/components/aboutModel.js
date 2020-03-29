import React from "react"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import RSlider from "./rSlider"

import {
    ComposedChart, Line, 
    Bar, XAxis, YAxis, Tooltip, Legend,
    ReferenceLine,
    ResponsiveContainer
} from 'recharts';

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
        const flatteningStarted = modelInputs.rAfter < 1.96; // @TODO refactor this...

        const yourLocation = modelInputs.state === 'All' ? modelInputs.country : modelInputs.state;

        /**
         * Combine data from all of the scenarios
         */
        var infectedDataArrays = [];
        var deadDataArrays = [];
        infectedDataArrays.push(
            extractDateAndKey(scenarios.current.dailyData, 'infectedInc',  'currentInfectedInc')
        );
        
        infectedDataArrays.push(
            extractDateAndKey(scenarios.current.dailyData, 'confirmedCasesInc', 'confirmedCasesInc')
        )

        deadDataArrays.push(
            extractDateAndKey(scenarios.current.dailyData, 'deadInc', 'currentDeadInc')
        )
        deadDataArrays.push(
            extractDateAndKey(scenarios.current.dailyData, 'confirmedDeathsInc', 'confirmedDeathsInc')
        )

        // const thresholdDayIndex = scenarios.current.summary.thresholdDayIndex;
        // const scenarioInfectedData = mergeDataArrays(infectedDataArrays);
        // const scenarioInfectedDataTillNow = scenarioInfectedData.slice(0, thresholdDayIndex + 15);
        
        const scenarioDeathData = mergeDataArrays(deadDataArrays);
        // const firstDeathIndex = scenarioDeathData.findIndex(x => x.confirmedDeathsInc > 0) || 0;
        // const scenarioDeathDataTillNow = scenarioDeathData.slice(firstDeathIndex, thresholdDayIndex + 90);

        return <div>
            <h1> About the scenarios </h1>
                <p>
                    We're inundated with many numbers and opinions with so much uncertainty.  
                    Most countries with outbreaks are not testing quickly or comprehensively, so their confirmed 
                    cases are incomplete.  As of March 24th, for example,
                    a survey of experts in the US estimated <a href="https://fivethirtyeight.com/features/experts-say-the-coronavirus-outlook-has-worsened-but-the-trajectory-is-still-unclear/">
                    the official count only includes 9% of actual cases</a>.
                </p>
                <p>
                    However, the worldwide efforts to research and share knowledge
                    are also amazing. At this point there is so much we don't know,
                    yet humanity has discovered so much!
                </p>
                <p>
                    On this page I want to aim to be accurate, given what we know. 
                    This is why all of the scenarios here start from the confirmed deaths in {yourLocation}. From there we can estimate 
                    how many people might have contracted the virus 3 weeks or so before each death.  Then
                    we can model transmission and predict how the virus spreads.  Since many countries focus 
                    testing on the most severe cases, confirmed deaths are likely more accurate than confirmed cases.             
                </p>
                <p>
                    Yet, I also want to acknowledge how much is unknown.  This is why you get to try
                    different scenarios based on knowing how your community is reducing virus transmission.
                </p>

                <p>
                    Please remember that <a href="https://en.wikipedia.org/wiki/All_models_are_wrong">
                    "all models are wrong, but some are useful"</a>.  Rely on your local authorities
                    for the most accurate and up-to-date information.  Hopefully this site helps give you useful context.
                </p>


                <h2>
                    Choose Your Scenario
                </h2>

                <p>
                    Each scenario here is tuned to the actual historical deaths and total population
                    from {yourLocation}. The chart below shows the confirmed deaths from the&nbsp; 
                    <a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins CSSE Dashboard</a>.
                    The line plotted on top shows what your scenario predicts. 
                </p>
                
                <h6 className="chartTitle">Actual vs. Predicted Deaths Each Day in Your Scenario</h6>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart
                        data={scenarioDeathData}
                        margin={{
                            top: 0, right: 0, left: 0, bottom: 0,
                        }}
                    >
                        <XAxis dataKey="date"/>                        
                        <YAxis type="number" />
                        <Tooltip formatter={readableInteger()}/>
                        <Legend/>

                        { flatteningStarted && 
                            <ReferenceLine x={moment(scenarios[chosenScenario].scenario.thresholdDate).format("YYYY-MM-DD")}
                                label="Flattening starts" />
                        }

                        <Line type="monotone" dataKey="currentDeadInc"  
                            name="My Scenario" stroke="#66c2a5" 
                            strokeWidth={4} dot={false}/>

                        <Bar dataKey="confirmedDeathsInc"
                            name="Actual Deaths" fill="#f00"/>
                    </ComposedChart>
                </ResponsiveContainer>

                Please choose a scenario.  You can change it any time using the green box on top.<br/><br/>
                    <RSlider name="rAfter" value={modelInputs.rAfter}
                        label="long" 
                        onChange={this.handleScenarioEditEvent}></RSlider>
        
                { flatteningStarted && 
                    <span>
                        Flattening measures&nbsp;
                        { moment(modelInputs.flatteningDate).isBefore(new Date(), 'day') ? "started" : "will start" } 
                        &nbsp; on &nbsp;
                        <input style={{width: "8rem"}} type="date" name="flatteningDate"
                                                value={ modelInputs.flatteningDate.toISOString().split('T')[0]}
                                                onChange={this.handleScenarioEditEvent}></input>
                        <br/>(For example, choose the day when lockdown or shelter-at-home started)<br/>
                    </span>
                }<br/>

                <p>
                    Each measure your community takes makes a difference, whether that means avoiding group events,
                    staying at home, testing rapidly, tracing and quarantining contacts.
                </p>

                <p>
                    When each infected person transmits the virus, on average, to less than one new person,
                    then the number of new cases and deaths will decrease over time.
                    This is what happens in the suppression scenarios above, where R&nbsp;&lt;&nbsp;1.
                    In these scenarios, we assume that once a community has reduced infections to a low level, it's possible
                    to relax measures like social distancing without risking another outbreak.
                    R is the "reproduction number" and indicates how many people each infected person
                    transmits the virus to in turn. 
                </p>
                <p>
                    If your community is on lockdown, staying at home, or practicing other strict distancing measures
                    where you interact with very few other people a day, try one of the suppression scenarios.
                </p>
                <p>
                    If each infected person transmits the virus, on average, to more than one new person,
                    then the number of new cases and deaths will increase over time.  This will continue
                    until a large portion of the population becomes infected.  This is what happens in each 
                    of the growth scenarios above, where R &gt; 1.
                </p> 

                <p>          
                   { !this.state.showDetails &&
                        <span>For more details about the scenarios, please 
                            <a onClick={this.handleToggleDetails.bind(this)}>
                            click here to show more</a>&nbsp;
                        </span>
                    }
                    { this.state.showDetails && 
                        <span><a onClick={this.handleToggleDetails.bind(this)}>Click here</a> to hide the details</span>
                    }
                </p>                 

        </div>
    }

}


export default AboutModel
