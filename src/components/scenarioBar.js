import TopBar from "./topBar"
import React from "react"
import { PresetScenarios, PresetCategories } from "../utils/model"
import ScenarioEditingComponent from "./scenarioEditingComponent"
import * as moment from "moment"


export default class ScenarioBar extends ScenarioEditingComponent {    
    render() {
        const modelInputs = this.props.modelInputs;

        return <TopBar minScroll={2300}>
            <select name="scenario" value={modelInputs.scenario} onChange={this.handleScenarioEditEvent}>
                        {
                            [...PresetScenarios.entries()].map(entry => {
                                const key = entry[0];
                                const scenarioData = entry[1];
                                if(scenarioData.category == PresetCategories.BASIC) {
                                    return <option key={key} value={key}>{scenarioData.name}</option>
                                } else {
                                    return "";
                                }
                            })
                        }
                    </select>
                    { modelInputs.scenario != "noFlattening" && 
                        <span> 
                            on&nbsp;
                            <input style={{width: "8rem"}} type="date" name="flatteningDate"
                                                    value={ modelInputs.flatteningDate.toISOString().split('T')[0]}
                                                    onChange={this.handleScenarioEditEvent}></input>
                        </span>
                    }
        </TopBar>
    }
}