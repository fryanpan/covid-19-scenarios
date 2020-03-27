import React from "react"
import { LocationManager } from "../utils/locationManager"

export default class MyInfo extends React.Component {
    /**
     * 
     * @param {Object} props Expects modelInputs to contain current model inputs
     * And a function handleModelInputChange that updates model inputs to new values 
     */
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    /** Pass changes back up to the index page component to update all parts of the page*/
    handleChange(e) {
        const key = e.target.name;
        const value = e.target.value;
        this.props.onModelInputChange(key, value);
    }

    render() {
        const modelInputs = this.props.modelInputs;
        const country = modelInputs.country;
        const state = modelInputs.state;
        const age = modelInputs.age;
        const flatteningDate = modelInputs.flatteningDate;
        const handleChange = this.handleChange.bind(this);
        const availableLocations = LocationManager.locationsForCountry(country);
        
        return <div>
             <p>
                Hope you are staying safe.  We are all a part of a pandemic spreading around the world.
                There are so many <a href="https://www.covidly.com">charts</a>,
                <a href="http://gabgoh.github.io/COVID"> disease modeling tools</a>,&nbsp;
                <a href="https://github.com/midas-network/COVID-19/tree/master/parameter_estimates/2019_novel_coronavirus">
                research papers</a>, and news articles.

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
                <form onSubmit={handleChange}>
                    I am <input type="text"
                        style={{width: "1.5rem"}} 
                        name="age"
                        value={age} 
                        onChange={handleChange}></input> years old and live in <select name="country" value={country} onChange={handleChange}>
                        <option value="" key="__blank"></option>
                        {
                            LocationManager.distinctCountries.map(x => 
                                <option value={x} key={x}>{x}</option>
                            )
                        }
                    </select>
                    { availableLocations.length > 1 && 
                        <span>
                        <br/>I want to see information about this state or province: 

                                <select name="state" value={state} onChange={handleChange}>
                                    {
                                        availableLocations.map(x => 
                                            <option value={x.state} key={x.state}>{x.state}</option>
                                        )
                                    }
                                </select>
                        </span>
                    }     
                </form>
            </p> 
            <p>
                Tip: You can also enter in an age and location for a friend or family member elsewhere in the world.
            </p>
            
        </div>
    }

}

