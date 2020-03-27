
import React from "react"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import Rheostat from "rheostat";
import 'rheostat/initialize';
import 'rheostat/css/rheostat.css';

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
 *  <RSlider name="mySlider" value={value} onChange={handleChange} />
 * }
 *  
 */
export default class RSlider extends ScenarioEditingComponent {    
    // Min and max R values (multipled by 100)
    static MIN = 20;
    static MAX = 400; 
    static DEFAULT = 80;

    handleUpdate(update) {
        const value = update.values[0] / 100;

        if(this.props.onChange) {
            const result = {
                target: {
                    name: this.props.name,
                    value: value
                }
            }
            this.props.onChange(result);
        }
    }

    render() {
        const value = this.props.value * 100 || RSlider.DEFAULT;

        return <div class="rSlider">
            <Rheostat
                min={RSlider.MIN}
                max={RSlider.MAX}
                onValuesUpdated={this.handleUpdate.bind(this)}
                progressBar="none"
                values={[RSlider.DEFAULT]}
            >
            </Rheostat>
        </div>
    }
}