import { StaticQuery, graphql} from "gatsby"
import React from "react"
import moment from "moment"

class MyInfo extends React.Component {
    /**
     * 
     * @param {Object} props Expects modelInputs to contain current model inputs
     * And a function handleModelInputChange that updates model inputs to new values 
     */
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.distinctCountries = props.distinctCountries;
        this.locations = props.locations;

        this.state = this.getUpdatedState(true);
    }

    lookupStates(country) {
        return this.locations.filter(x => x.country === country);
    }

    /**
     * 
     * @param {Boolean} changedLocation Whether the location changed 
     */
    getUpdatedState(changedLocation) {
        const modelInputs = this.props.modelInputs;
        console.log("UPdating available locations", modelInputs);
        // update states value
        const availableLocations = this.lookupStates(modelInputs.country);
        
        // clamp to one if there's only one
        if(availableLocations.length === 1) {
            modelInputs.state = availableLocations[0].state;
        } else {
            if(availableLocations.find(x => x.state === modelInputs.state) === undefined) {
                modelInputs.state = "All";
            }
        }

        // update social distancing information, if location changed
        if(changedLocation) {
            const chosenLocation = availableLocations.find(x => x.country === modelInputs.country && x.state === modelInputs.state);
            console.log("Changing to hammer date for location", chosenLocation.country, chosenLocation.state, chosenLocation.hammerDate);
            if(chosenLocation.hammerDate) {
                modelInputs.hammerDate = moment(chosenLocation.hammerDate).toDate();
            }
        }

        return {
            availableLocations: availableLocations,
            modelInputs: modelInputs
        }
    }

    handleChange(e) {
        const handleModelInputChange = this.props.onModelInputChange;

        // construct data to change
        console.log(`Changing ${e.target.name} to ${e.target.value}`);

        var modelInputs = this.props.modelInputs;
        const name = e.target.name;
        const value = e.target.value;
        const changedLocation = e.target.name === "country" || e.target.name === "state";

        if(name === "isSocialDistancing") {
            modelInputs[name] = value === "true";
        } else if (name === "hammerDate") {
            modelInputs[name] = new Date(value);
        } else if (name === "age") {
            modelInputs.age = value === "" ? "" : parseInt(value);
        } else {
            modelInputs[name] = value;
        }

        const newState = this.getUpdatedState(changedLocation);
        this.setState(prevState => {
            return newState;
        });

        handleModelInputChange(newState.modelInputs);
    }

    render() {
        const modelInputs = this.state.modelInputs;
        const country = modelInputs.country;
        const state = modelInputs.state;
        const age = modelInputs.age;
        const isSocialDistancing = modelInputs.isSocialDistancing;
        const hammerDate = modelInputs.hammerDate;
        const handleChange = this.handleChange.bind(this);
        console.log(hammerDate);
        
        return <div>
            <h1>
                About me 
            </h1>
            <form>
                <p>
                I am <input type="text"
                        style={{width: "1.5rem"}} 
                        name="age"
                        value={age} 
                        onChange={handleChange}></input> years old
                </p>
                <p>
                I live in <select name="country" value={country} onChange={handleChange}>
                        <option value="" key="__blank"></option>
                        {
                            this.distinctCountries.map(x => 
                                <option value={x} key={x}>{x}</option>
                            )
                        }
                    </select>
                </p>
                { this.state.availableLocations.length > 1 && 
                    <p>
                    I want to see information about this state or province: 

                            <select name="state" value={state} onChange={handleChange}>
                                {
                                    this.state.availableLocations.map(x => 
                                        <option value={x.state} key={x.state}>{x.state}</option>
                                    )
                                }
                            </select>
                    </p>
                }                

                <p>
                    We have <select name="isSocialDistancing"
                                value={isSocialDistancing ? "true" : "false"}
                                onChange={handleChange}>
                                    <option value="true">started</option>
                                    <option value="false">not started</option>
                            </select> social distancing&nbsp;
                    {isSocialDistancing &&
                        <span> 
                            since <input style={{width: "7rem"}} type="date" name="hammerDate"
                                                    value={hammerDate.toISOString().split('T')[0]}
                                                    onChange={handleChange}></input>
                        </span>
                    }&nbsp;&nbsp;
                    {isSocialDistancing &&
                        <span>
                            <br/>This means that most of us are trying to minimize contact with people we do not live with.
                        </span>
                    }          
                    {!isSocialDistancing && 
                        <span>
                            This means that most of us are regularly around people we do not live with.
                        </span>
                    }
                </p>
            </form>
        </div>
    }

}

/** Using a static query with a class-based component.  Snippet adapted from here:
 * https://spectrum.chat/gatsby-js/general/is-this-a-good-way-of-using-gatsby-v2s-staticquery-with-react-component-class~d9db7af2-f594-4199-9640-8756f39876d5
 */
export default props => (
    <StaticQuery
      query={ graphql`query {
            allLocationsCsv {
                distinct(field: country)
                nodes {
                    country
                    state
                    hammerDate
                }
            }
        }`}
      render={({ allLocationsCsv }) => <MyInfo distinctCountries={allLocationsCsv.distinct} locations={allLocationsCsv.nodes} {...props} />}
    />
  )

