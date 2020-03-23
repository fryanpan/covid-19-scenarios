import { StaticQuery, graphql} from "gatsby"
import React from "react"

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

        this.state = {
            availableLocations: this.getAvailableLocations()
        };
    }

    lookupStates(country) {
        return this.locations.filter(x => x.country === country);
    }

    getAvailableLocations() {
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
        console.log("Choosing state", modelInputs.state);
        return availableLocations;
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
        } else {
            modelInputs[name] = value;
        }

        const newLocations = this.getAvailableLocations();
        this.setState({
            availableLocations: newLocations
        });
        
        const currentLocation = newLocations.find(x => x.country === modelInputs.country && x.state === modelInputs.state);

        // update social distancing information, if location changed
        if(changedLocation) {
            modelInputs.hammerDate = currentLocation.hammerDate || modelInputs.hammerDate;
        }

        console.log("New modelInputs", modelInputs);

        handleModelInputChange(modelInputs);
    }

    render() {
        const modelInputs = this.props.modelInputs;
        const country = modelInputs.country;
        const state = modelInputs.state;
        const age = modelInputs.age;
        const isSocialDistancing = modelInputs.isSocialDistancing;
        const hammerDate = modelInputs.hammerDate;
        const handleChange = this.handleChange.bind(this);
        
        return <div>
            <h1>
                About me 
            </h1>
            <form>
                <p>
                I live in <select name="country" value={country} onChange={handleChange}>
                        <option value="" key="__blank"></option>
                        {
                            this.distinctCountries.map(x => 
                                <option value={x} key={x}>{x}</option>
                            )
                        }
                    </select> 
                { this.state.availableLocations.length > 1 && 
                    <span>
                        (state or province 
                            <select name="state" value={state} onChange={handleChange}>
                                {
                                    this.state.availableLocations.map(x => 
                                        <option value={x.state} key={x.state}>{x.state}</option>
                                    )
                                }
                            </select>
                        )
                    </span>
                }

                and I am <input type="text"
                        style={{width: "1.5rem"}} 
                        name="age"
                        value={age} 
                        onChange={handleChange}></input> years old
                </p>

                <p>
                    My city is <select name="isSocialDistancing"
                                value={isSocialDistancing ? "true" : "false"}
                                onChange={handleChange}>
                                    <option value="true">social distancing</option>
                                    <option value="false">not social distancing</option>
                            </select>&nbsp;
                    {isSocialDistancing &&
                        <span> 
                            and this started on <input style={{width: "7rem"}} type="date" name="hammerDate"
                                                    value={hammerDate.toISOString().split('T')[0]}
                                                    onChange={handleChange}></input>
                        </span>
                    }<br/>
                    {isSocialDistancing &&
                        <span>
                            This means that most of us are trying to minimize contact with other people (for example by staying home except for essential trips).
                        </span>
                    }          
                    {!isSocialDistancing && 
                        <span>
                            This means that most of us are not trying to minimize contact. 
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
                }
            }
        }`}
      render={({ allLocationsCsv }) => <MyInfo distinctCountries={allLocationsCsv.distinct} locations={allLocationsCsv.nodes} {...props} />}
    />
  )

