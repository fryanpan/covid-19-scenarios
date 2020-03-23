/**
 * Displays the simulation data
 */

import React from "react"

import "./simDataTable.css"

class SimulationDataTable extends React.Component {
    render() {
        const modelData = this.props.modelData;

        return <>
                <h1> Simulation Data </h1>
                <table>
                    <thead>
                        <tr>
                            <th rowSpan="2">Index</th>
                            <th rowSpan="2">Date</th>
                            <th colSpan="2" style={{backgroundColor: "lightGrey", textAlign: "center"}}>Confirmed</th>
                            <th colSpan="7" style={{backgroundColor: "darkGrey", textAlign: "center"}}>Simulated</th>
                            
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
                            <th>Total Infected</th>
                        </tr>
                        </thead>
                        <tbody>
                            { modelData.map(row => <tr key={row.index}>
                                            <td>{row.index}</td>
                                            <td width="100px">{row.date.toISOString().split('T')[0]}</td>
                                            <td>{row.confirmedCases}</td>
                                            <td>{row.confirmedDeaths}</td>

                                            <td>{Math.round(row.susceptible)}</td>

                                            <td>{Math.round(row.exposed)}</td>

                                            <td>{Math.round(row.infected)}</td>

                                            <td>{Math.round(row.infectious)}</td>

                                            <td>{Math.round(row.recovered)}</td>

                                            <td>{Math.round(row.dead)}</td>
                                            <td>{Math.round(row.totalInfected)}</td>
                                            <td></td>
                                        </tr>)
                            }    
                        </tbody>
                </table>
            </>
    }
}

export default SimulationDataTable
