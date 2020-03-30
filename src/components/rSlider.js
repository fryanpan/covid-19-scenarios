
import React from "react"
import PropTypes from "prop-types"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import Rheostat from "rheostat";
import 'rheostat/initialize';
import 'rheostat/css/rheostat.css';

import "./rSlider.css";

/**
 * A slider widget to choose a basic reproduction number
 * 
 * With helpful context from real data.
 * 
 * @component
 * @example
 * const value = 2.5;
 * function handleChange(e) {
 *      console.log(e.target.name, e.target.value);
 * }
 * return {
 *  <RSlider name="mySlider" value={value} label="r" onChange={handleChange} />
 * }
 *  
 */
export default class RSlider extends ScenarioEditingComponent {    
    static propTypes = {
        /** The name of the element (optional) */
        name: PropTypes.string,

        /** The value to assign the slider to (optional) */
        value: PropTypes.number,

        /** The callback to use when a value changes (this is throttled) */
        onChange: PropTypes.func,

        /** The type of label to show below.  Must be one of { 'none', 'short', 'long' } */
        label: PropTypes.string,
    }

    // Min and max R values (multipled by 100)
    static MIN = 20;
    static MAX = 400; 

    // Uses the first matching range for a label.
    // Ranges include both endpoints
    static CATEGORIES = [
        [ [30, 50], "Strong suppression (like lockdown in China)", true ],
        [ [RSlider.MIN,  50], "Strong suppression" ],

        [ [50, 99], "Moderate suppression" ],

        [ [119, 136], "Flattened, slow growth (Feb. in Singapore)", true],
        [ [100, 140], "Flattened, slow growth" ],

        [ [140, 160], "Flattened with growth (Feb. in South Korea)", true ],
        [ [130, 200], "Flattened with growth" ],

        [ [196, 255], "Uncontrolled growth (China before lockdown", true ],
        [ [200, 300], "Uncontrolled growth" ],

        [ [360, 420], "Rapid uncontrolled growth (Feb. in Iran)", true ],
        [ [300, RSlider.MAX], "Rapid uncontrolled growth" ]
        
    ]

    constructor(props) {
        super(props);
        
        this.showLabel = this.props.label !== 'none';
        this.allowLong = this.props.label == 'long';
    }

    findCategory(value) {
        for(const category of RSlider.CATEGORIES) {
            const range = category[0];
            const label = category[1];
            const long = category[2];
            if(value >= range[0] && value <= range[1] && (!long || this.allowLong)) {
                return label;
            }
        }
    }

    handleUpdate(update) {
        const value = update.values[0];

        if(this.props.onChange) {
            const result = {
                target: {
                    name: this.props.name,
                    value: value / 100 // convert back to normal R values for external consumption
                }
            }
            this.props.onChange(result);
        }
    }

    render() {
        const category = this.findCategory(this.props.value * 100);

        return <span className="rSlider">
            { this.showLabel && 
                <div className="label" style={{}}>
                    {category} (R = {this.props.value})  
                </div>
            }
            <Rheostat
                min={RSlider.MIN}
                max={RSlider.MAX}
                onValuesUpdated={this.handleUpdate.bind(this)}
                progressBar=""
                values={[this.props.value * 100]}
            >
            </Rheostat>
            
        </span>
    }
}