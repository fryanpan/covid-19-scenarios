import React from "react"
import { LocationManager } from "../utils/locationManager"
import ScenarioEditingComponent from "./scenarioEditingComponent"

export default class MyInfo extends ScenarioEditingComponent {
    /**
     * 
     * @param {Object} props Expects modelInputs to contain current model inputs
     * And a function handleModelInputChange that updates model inputs to new values 
     */

    render() {
        const modelInputs = this.props.modelInputs;
        const { country, state, age, sex } = modelInputs;
        const flatteningDate = modelInputs.flatteningDate;
        const availableLocations = LocationManager.locationsForCountry(country);
        
        return <div>
             <p>
                Hope you are staying safe.  We are all a part of a pandemic spreading around the world.
                There are so many <a href="https://www.covidly.com">charts</a>,
                <a href="http://gabgoh.github.io/COVID"> disease modeling tools</a>,&nbsp;
                <a href="https://github.com/midas-network/COVID-19/tree/master/parameter_estimates/2019_novel_coronavirus">
                research papers</a>, news articles, and&nbsp; 
                <a href="https://www.gatesnotes.com/Health/A-coronavirus-AMA">thoughtful Q&amp;As
                from people named Bill</a>.

            </p>
            <p>
                This page hopes to do something different.  It focuses on answering questions that
                are relevant to you and your community. Even though the future is uncertain, it is possible to 
                &nbsp;<a href="https://hbr.org/1997/11/strategy-under-uncertainty">
                guess at plausible scenarios
                </a>.
            </p>

            <p>
                Let's start with some info about you, so we can make this relevant who you are and where you live.
            </p>
            <p>
                I am <input type="text"
                    style={{width: "3rem"}} 
                    name="age"
                    value={age} 
                    onChange={this.handleScenarioEditEvent}></input> years old and my sex is 
                    <select name="sex" value={sex} onChange={this.handleScenarioEditEvent}>
                        <option value="Male">Male</option> 
                        <option value="Female">Female</option> 
                    </select>
                <br/>I'm in <select name="country" value={country} onChange={this.handleScenarioEditEvent}>
                    <option value="" key="__blank"></option>
                    {
                        LocationManager.distinctCountries.map(x => 
                            <option value={x} key={x}>{x}</option>
                        )
                    }
                </select>
                { availableLocations.length > 1 && 
                    <span>
                    <br/>{country == "United States" ? "State:" : "Province:"}&nbsp; 

                            <select name="state" value={state} onChange={this.handleScenarioEditEvent}>
                                {
                                    availableLocations.map(x => 
                                        <option value={x.state} key={x.state}>{x.state}</option>
                                    )
                                }
                            </select>
                    </span>
                }     
            </p> 
            <p>
                Tip: You can also enter in information for a friend or family member
                to see what it's like for them.  
            </p>
            
        </div>
    }

}

