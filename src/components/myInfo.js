import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import model from "../utils/model";

class MyInfo extends React.Component {
    /**
     * 
     * @param {Object} props Expects modelInputs to contain current model inputs
     * And a function handleModelInputChange that updates model inputs to new values 
     */
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(e) {
        const handleModelInputChange = this.props.onModelInputChange;
        // construct data to change


        var modelInputs = this.props.modelInputs;
        const name = e.target.name;
        const value = e.target.value;
        if(name == "isSocialDistancing") {
            modelInputs[name] = value == "true";
        } else {
            modelInputs[name] = value;
        }
        console.log(modelInputs);

        handleModelInputChange(modelInputs);
    }

    render() {
        const modelInputs = this.props.modelInputs;
        const country = modelInputs.country;;
        const state = modelInputs.state;
        const age = modelInputs.age;
        const isSocialDistancing = modelInputs.isSocialDistancing;
        const socialDistancingStartDate = modelInputs.socialDistancingStartDate;
        const handleChange = this.handleChange.bind(this);
        
        return <div>
            <h1>
                About me 
            </h1>
            <form>
                <p>
                I live in <input name="country"
                                 value={country}
                                 onChange={handleChange}></input><br/>

                I am <input type="text" 
                        name="age"
                        value={age} 
                        onChange={handleChange}></input> years old<br/>

                My city is <select name="isSocialDistancing"
                            value={isSocialDistancing ? "true" : "false"}
                            onChange={handleChange}>
                                <option value="true">social distancing</option>
                                <option value="false">not social distancing</option>
                        </select>&nbsp;
            </p>
                {isSocialDistancing &&
                    <span> 
                        and this started on <input type="date" name="socialDistancingStartDate"
                                                value={socialDistancingStartDate}
                                                onChange={handleChange}></input>.  
                    </span>
                }
                {isSocialDistancing &&
                    <p>
                        This means that most of us are staying at home, except for essential trips.
                    </p>  
                }
                {!isSocialDistancing &&
                    <p>
                        This means that we are not staying at home.  We are meeting other people every day that we don't live with.
                    </p>
                }
            </form>
        </div>
    }

}


export default MyInfo
