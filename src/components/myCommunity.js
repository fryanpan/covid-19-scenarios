import React from "react"

import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } from 'recharts';
  

class MyCommunity extends React.Component {    
    render() {        
        console.log("Rendering charts", this.props.modelData);
        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>

            <h2>How many people might be exposed?</h2>
            <BarChart
                width={500}
                height={300}
                data={this.props.modelData}
                margin={{
                top: 20, right: 30, left: 20, bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="exposed" stackId="a" fill="#8884d8" />
                <Bar dataKey="infected" stackId="a" fill="#82ca9d" />
                <Bar dataKey="recovered" stackId="a" fill="#8884d8" />
                <Bar dataKey="dead" stackId="a" fill="#8884d8" />
            </BarChart>
        </div>
    }

}


export default MyCommunity
