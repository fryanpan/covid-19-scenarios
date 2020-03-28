import TopBar from "./topBar"
import React from "react"
import { PresetScenarios, PresetCategories } from "../utils/model"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import RSlider from "./rSlider"
import * as moment from "moment"

import "./scenarioBar.css"

export default class ScenarioBar extends ScenarioEditingComponent {    
    render() {
        const modelInputs = this.props.modelInputs;

        return <TopBar minScroll={2000}>
                <RSlider name="rAfter" value={modelInputs.rAfter} label="short"
                    onChange={this.handleScenarioEditEvent}/>
                { modelInputs.rAfter < 1.96 && 
                        <span class="measures"> 
                            Measures start on&nbsp;
                            <input  type="date" name="flatteningDate"
                                                    value={ modelInputs.flatteningDate.toISOString().split('T')[0]}
                                                    onChange={this.handleScenarioEditEvent}></input>
                        </span>
                }

        </TopBar>
    }
}