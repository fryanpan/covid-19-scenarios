import TopBar from "./topBar"
import React from "react"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import RSlider from "./rSlider"

import "./scenarioBar.css"

export default class ScenarioBar extends ScenarioEditingComponent {    
    render() {
        const modelInputs = this.props.modelInputs;
        const minScroll = this.props.minScroll || 1200;

        console.log("minScroll", minScroll);

        return <TopBar minScroll={minScroll}>
                <RSlider name="rAfter" value={modelInputs.rAfter} label="long"
                    onChange={this.handleScenarioEditEvent}/>
                { modelInputs.rAfter < 1.96 && 
                        <span className="measures"> 
                            Measures start on&nbsp;
                            <input  type="date" name="flatteningDate"
                                                    value={ modelInputs.flatteningDate.toISOString().split('T')[0]}
                                                    onChange={this.handleScenarioEditEvent}></input>
                        </span>
                }

        </TopBar>
    }
}