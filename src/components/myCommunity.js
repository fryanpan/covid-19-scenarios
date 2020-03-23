import React from "react"

import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  } from 'recharts';

import moment from 'moment';
  

class MyCommunity extends React.Component {    
    formatDateAxis(tickItem) {
        console.log(tickItem);
        return moment(tickItem).toString("YYYY-MM-DD");
    }

    render() {        
        console.log("Rendering charts", this.props.modelData);
        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>

            <h2>How many people might be exposed?</h2>
            <AreaChart
                width={960}
                height={300}
                data={this.props.modelData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
            >
                <XAxis dataKey="date" tickFormatter={this.formatDateAxis}/>
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="recovered"  fill="#8884d8" />
                <Area type="monotone" dataKey="infected"  fill="#82ca9d" />
                <Area type="monotone" dataKey="exposed" fill="#8884d8" />
                <Area type="monotone" dataKey="dead" fill="#8884d8" />
            </AreaChart>

            <h2>How many people might die?</h2>
            <BarChart
                width={960}
                height={300}
                data={this.props.modelData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
                barCategoryGap={1}
                barGap={0}
            >
                <XAxis dataKey="date" tickFormatter={this.formatDateAxis}/>
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar type="monotone" dataKey="confirmedDeaths" stackId="a" fill="#82ca9d" />
                <Bar type="monotone" dataKey="dead" stackId="b" fill="#8884d8" />
            </BarChart>
        </div>
    }

}


export default MyCommunity
