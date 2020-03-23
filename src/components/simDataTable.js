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
                            <th>Index</th>
                            <th>Date</th>
                            <td>New Confirmed Cases</td>
                            <td>New Confirmed Deaths</td>
                            <th>Susceptible</th>
                            <th>Exposed</th>
                            <th>Infected</th>
                            <th>Infectious</th>
                            <th>Recovered</th>
                            <th>Dead</th>
                        </tr>    
                        </thead>
                        <tbody>
                            { modelData.map(row => <tr key={row.index}>
                                            <td>{row.index}</td>
                                            <td width="100px">{row.date.toISOString().split('T')[0]}</td>
                                            <td>{row.confirmedCasesInc}</td>
                                            <td>{row.confirmedDeathsInc}</td>

                                            <td>{Math.round(row.susceptible)}</td>

                                            <td>{Math.round(row.exposed)}</td>

                                            <td>{Math.round(row.infected)}</td>

                                            <td>{Math.round(row.infectious)}</td>

                                            <td>{Math.round(row.recovered)}</td>

                                            <td>{Math.round(row.dead)}</td>
                                        </tr>)
                            }    
                        </tbody>
                </table>
            </>
    }
}

export default SimulationDataTable
