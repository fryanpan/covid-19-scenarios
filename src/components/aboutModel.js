import React from "react"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import RSlider from "./rSlider"
import Media from 'react-media';

import {
    ComposedChart, Line, 
    Bar, XAxis, YAxis, Tooltip, Legend,
    ReferenceLine, ReferenceDot,
    ResponsiveContainer
} from 'recharts';

import * as moment from 'moment'
import { mergeDataArrays, readableInteger, listOfMonths, readableMonth, readableNumber } from '../utils/dataUtils'
import { PresetCategories } from '../utils/model'

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

    render() {        
        const scenarios = this.props.modelData;
        const modelInputs = this.props.modelInputs;
        const chosenScenario = modelInputs.scenario;
        const flatteningStarted = modelInputs.rAfter < 1.96; // @TODO refactor this...
        const flatteningStartedBeforeToday = moment(modelInputs.flatteningDate).isBefore(new Date(), 'day');
        const flatteningVerb = flatteningStartedBeforeToday ? "started" : "will start";

        const yourLocation = modelInputs.state === 'All' ? modelInputs.country : modelInputs.state;

        /**
         * Combine data from all of the scenarios
         */
        var deadDataArrays = [];

        const scenarioKeys = Object.keys(scenarios);
        for(let key of scenarioKeys) {
            if(scenarios[key].scenario.category != PresetCategories.USER) continue;
            deadDataArrays.push(extractDateAndKey(scenarios[key].dailyData, 'deadInc', key + 'DeadInc'))
        }

        console.log("Scenarios", scenarioKeys, deadDataArrays);

        deadDataArrays.push(
            extractDateAndKey(scenarios.current.dailyData, 'confirmedDeathsInc', 'confirmedDeathsInc')
        )

        // const thresholdDayIndex = scenarios.current.summary.thresholdDayIndex;
        // const scenarioInfectedData = mergeDataArrays(infectedDataArrays);
        // const scenarioInfectedDataTillNow = scenarioInfectedData.slice(0, thresholdDayIndex + 15);
        var endOfYearIndex = scenarios.current.dailyData.findIndex( x => moment(x).year() == 2021) ||
            scenarios.current.dailyData.length - 1;
        
        const scenarioDeathData = mergeDataArrays(deadDataArrays).slice(0, endOfYearIndex);
        const maxValue = scenarioDeathData.reduce((prev, cur) => Math.max(prev, cur.currentDeadInc), 0);

        // const firstDeathIndex = scenarioDeathData.findIndex(x => x.confirmedDeathsInc > 0) || 0;
        // const scenarioDeathDataTillNow = scenarioDeathData.slice(firstDeathIndex, thresholdDayIndex + 90);

        return <div>
            <div class='hideable'>
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
                        This is why all of the scenarios below start from the confirmed deaths in {yourLocation}, the location you picked. 
                        From there we can estimate how many people might have contracted the virus 3 weeks or so before each death.  Then
                        we can model transmission and predict how the virus spreads.  Since many countries focus 
                        testing on the most severe cases, confirmed deaths are likely more accurate than confirmed cases.
                    </p>
                    <p>
                        Yet I also want to acknowledge how much is unknown.  We don't know exactly how
                        quickly virus transmission happens or what fatality and recovery rates look like
                        in each community.  Plus the
                        model here is a simple SEIR disease model.  A simple model like this 
                        &nbsp;<a href="https://www.tableau.com/about/blog/2020/3/unpredictable-curve-covid-19">does not fully represent the real world</a>.  
                        Every model out there includes a great deal of uncertainty.  See the FiveThirtyEight post on 
                        &nbsp;<a href="https://fivethirtyeight.com/features/why-its-so-freaking-hard-to-make-a-good-covid-19-model/">
                            why modeling COVID-19 is hard</a>.
                    </p> 
                    <p>
                        In short, please remember that <a href="https://en.wikipedia.org/wiki/All_models_are_wrong">
                        "all models are wrong, but some are useful"</a>.  Rely on your local officials
                        for the most accurate and up-to-date information.  If you like the charts here more
                        than your local dashboards, ask your officials for better dashboards :) 
                    </p>
                  
                    <p>
                        However, despite every single scenario here being wrong, I hope the 
                        range of possibilities gives you a gut feel for what's plassible
                        in your community, tied to actual local data.  From that, I hope you 
                        also gain a gut sense for other questions like
                        how you might act? What data to look for from officials and when?
                        Specifically, how can we tell how well suppression efforts are working?  
                        How does that inform how a community chooses to manage in the future?                       
                    </p>
                    <p>
                        In short, please don't put much trust in any single scenario here. Try different
                        scenarios, see how they feel. Hopefully you gain a stronger sense
                        for what to expect.
                    </p>
            </div>

                <h2>
                    Pick A Scenario
                </h2>

                <p className="hideable">
                    Each scenario here is based on the actual historical deaths and total population
                    from {yourLocation}. The chart below shows the confirmed deaths from the&nbsp; 
                    <a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins CSSE Dashboard</a>.
                    The line plotted on top shows what your scenario predicts.  If your community 
                    has not had many deaths yet, the model may behave oddly.
                </p>
                
                <h6 className="chartTitle">Actual vs. Predicted Deaths Each Day in Your Scenario</h6>
                <Media queries={{
                        small: "(max-width: 699px)",
                        large: "(min-width: 700px)"
                    }}>
                    {matches => (
                        <ResponsiveContainer width="100%" height={400}>
                            <ComposedChart
                                data={scenarioDeathData}
                                margin={{
                                    top: 20, right: 0, left: 0, bottom: 0,
                                }}
                            >

                                {scenarioKeys.map(key => {
                                    return <Line type="monotone" dataKey={`${key}DeadInc`}  
                                        name={key} stroke="#cbd5e8" 
                                        strokeWidth={1} dot={false}/>
                                })}

                                <Bar dataKey="confirmedDeathsInc"
                                    name="Actual Deaths" fill="#fc8d62"/>


                                { flatteningStarted && 
                                    <ReferenceLine x={moment(scenarios[chosenScenario].scenario.thresholdDate).format("YYYY-MM-DD")} />
                                }
                                { flatteningStarted && 
                                    <ReferenceDot x={moment(scenarios[chosenScenario].scenario.thresholdDate).format("YYYY-MM-DD")}
                                        y={maxValue * 0.9}
                                        r={0}
                                        inFront={true}
                                        label={"Flattening " + flatteningVerb} />
                                }
                                <XAxis type="category" dataKey="date" 
                                    ticks={listOfMonths("2020-01-01", "2020-12-01")}
                                    interval={matches.small ? 1 : 0}
                                    tickFormatter={readableMonth}
                                    />

                                <YAxis type="number"/>
                                <Tooltip formatter={readableInteger()}/>
                                <Legend iconType="square"/>
                            </ComposedChart>    
                        </ResponsiveContainer>
                    )}
                </Media>

                <p className="hideable">
                    Please choose a scenario.  
                    You can change it any time using the green box on top.
                    It's especially interesting to compare suppression and growth scenarios. On this page, any time we plot 
                    actual data, it will be in a solid color.  Scenario data will always be in lighter colors. 
                </p>
                    <RSlider name="rAfter" value={modelInputs.rAfter}
                        label="long" 
                        onChange={this.handleScenarioEditEvent}></RSlider>
        
                { flatteningStarted && 
                    <span>
                        Flattening measures&nbsp;
                        { flatteningVerb } 
                        &nbsp; on &nbsp;
                        <input style={{width: "8rem"}} type="date" name="flatteningDate"
                                                value={ modelInputs.flatteningDate.toISOString().split('T')[0]}
                                                onChange={this.handleScenarioEditEvent}></input>
                        <br/>(For example, choose the day when lockdown or shelter-at-home started)<br/>
                    </span>
                }<br/>

                {/* <RSlider name="rBefore" value={modelInputs.rBefore}
                        label="long" 
                        onChange={this.handleScenarioEditEvent}></RSlider> */}

                <div className="hideable">
                    <p>
                        Each measure your community takes makes a difference, whether that means avoiding group events,
                        staying at home, testing rapidly, tracing and quarantining contacts.
                    </p>

                    <p>
                        When each infected person transmits the virus, on average, to less than one new person,
                        then the number of new cases and deaths will decrease over time.
                        This is what happens in the suppression scenarios above, where R&nbsp;&lt;&nbsp;1.
                        R is the "reproduction number" and indicates how many people each infected person
                        transmits the virus to in turn. In these scenarios, we don't simulate what happens
                        once the number of infections drops to a low level and suppression measures might
                        relax.
                    </p>
                    <p>
                        If your community is on lockdown, staying at home, or practicing other strict distancing measures
                        where you interact with very few other people a day, try one of the suppression scenarios.
                    </p>
                    <p>
                        If each infected person transmits the virus, on average, to more than one new person,
                        then the number of new cases and deaths will increase over time.  This will continue
                        until a large portion of the population becomes infected.  This is what happens in each 
                        of the growth scenarios above, where R &gt; 1.  Healthcare capacity in hospitals 
                        becomes more important in these scenarios, and the scenarios here do not account for 
                        what happens when your community runs out of ICU beds in the hospital.
                    </p>         
                </div>        

        </div>
    }

}


export default AboutModel
