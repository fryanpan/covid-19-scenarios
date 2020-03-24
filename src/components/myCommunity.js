import React from "react"
import * as d3Format from "d3-format"

import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

import moment from 'moment';
  

class MyCommunity extends React.Component {    
    render() {        
        const scenarios = this.props.modelData;
        const percentFormatter = d3Format.format(",.0%");

        return <div>
            <h1>
                How might COVID-19 spread in my community?
            </h1>

            <h2>How many people might be exposed?</h2>
            <AreaChart
                width={960}
                height={300}
                data={scenarios.current.dailyData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
            >
                <XAxis dataKey="date"/>
                <YAxis width={100}/>
                <Tooltip />
                <Legend />
                <Area type="linear" dataKey="recovered"  fill="#8884d8" />
                <Area type="linear" dataKey="infected"  fill="#82ca9d" />
                <Area type="linear" dataKey="exposed" fill="#8884d8" />
                <Area type="linear" dataKey="dead" fill="#8884d8" />
            </AreaChart>

            <h2>How many people might die?</h2>
            <AreaChart
                width={960}
                height={300}
                data={scenarios.current.dailyData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
                // barCategoryGap={1}
                // barGap={0}
            >
                <XAxis dataKey="date"/>
                <YAxis width={100} />
                <Tooltip />
                <Legend />
                <Area type="step" dataKey="dead" fill="#8884d8" />
                <Area type="step" dataKey="confirmedDeaths" fill="#82ca9d" />
            </AreaChart>

            <h2>How can I tell if social distancing is working?</h2>

            <h2>When might social distancing end?</h2>

            <h2>How well are we testing?</h2>
            <BarChart
                width={960}
                height={300}
                data={scenarios.current.dailyData.slice(0, scenarios.current.summary.currentDayIndex)}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 0,
                }}
                // barCategoryGap={1}
                // barGap={0}
            >
                <XAxis dataKey="date"/>
                <YAxis width={100} tickFormatter={percentFormatter} domain={[0,1]} />
                <Tooltip formatter={percentFormatter}/>
                <Legend />
                <Bar type="monotone" dataKey="testingRatio" fill="#8884d8" />
            </BarChart>
            <h3>Comparison with other countries</h3>
        </div>
    }

}


export default MyCommunity
