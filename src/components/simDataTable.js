/**
 * Displays the simulation data
 */

import React from "react"
import * as d3Format from "d3-format"

import "./simDataTable.css"

class SimulationDataTable extends React.Component {
    render() {
        const modelData = this.props.modelData;
        const dailyData = modelData.dailyData;
        const scenario = modelData.scenario;

        return <>
                <h1> Simulation Data </h1>
                <h2> Inputs </h2>
                <table className="inputdata">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Population</td><td>{scenario.population}</td>
                        </tr>
                        <tr>
                            <td>Basic reproduction number, before (R0)</td><td>{scenario.rBefore}</td>
                        </tr>
                        <tr>
                            <td>Case fatality rate, before (R0)</td><td>{scenario.cfrBefore}</td>
                        </tr>
                        <tr>
                            <td>Threshold date</td><td>{scenario.thresholdDate}</td>
                        </tr>
                        <tr>
                            <td>Basic reproduction number, after (R0)</td><td>{scenario.rAfter}</td>
                        </tr>
                        <tr>
                            <td>Case fatality rate, after (R0)</td><td>{scenario.cfrAfter}</td>
                        </tr>
                    </tbody>
                </table>

                <h2> Output </h2>
                <table className="simdata">
                    <thead>
                        <tr>
                            {/* <th rowSpan="2">Index</th> */}
                            <th width="80" rowSpan="2">Date</th>
                            <th width="200" colSpan="2" style={{backgroundColor: "lightGrey", textAlign: "center"}}>Confirmed</th>
                            <th width="680" colSpan="6" style={{backgroundColor: "darkGrey", textAlign: "center"}}>Simulated</th>
                            
                        </tr>    
                        <tr>
                            <th>Cases</th>
                            <th>Deaths</th>
                            <th>Susceptible</th>
                            <th>Exposed</th>
                            <th>Infected</th>
                            <th>Infectious</th>
                            <th>Recovered</th>
                            <th>Dead</th>
                            {/* <th>Total Exposed</th>
                            <th>Total Infected</th>
                            <th>Testing %</th> */}
                        </tr>
                        </thead>
                        <tbody>
                            { dailyData.map(row => <tr key={row.index}>
                                            {/* <td>{row.index}</td> */}
                                            <td width="100px">{row.date}</td>
                                            <td>{row.confirmedCases}</td>
                                            <td>{row.confirmedDeaths}</td>

                                            <td>{Math.round(row.susceptible)}</td>

                                            <td>{Math.round(row.exposed)}</td>

                                            <td>{Math.round(row.infected)}</td>

                                            <td>{Math.round(row.infectious)}</td>

                                            <td>{Math.round(row.recovered)}</td>

                                            <td>{Math.round(row.dead)}</td>
                                            {/* <td>{Math.round(row.totalExposed)}</td>
                                            <td>{Math.round(row.totalInfected)}</td>
                                            <td>{d3Format.format(",.2%")(row.testingRatio)}</td> */}
                                        </tr>)
                            }    
                        </tbody>
                </table>
            </>
    }
}

export default SimulationDataTable
