import React from "react"
import * as d3Format from "d3-format"

// import {
//     AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
// } from 'recharts';

import moment from 'moment';
  

class AboutModel extends React.Component {    
    render() {        
        const scenarios = this.props.modelData;

        return <div>
            <h1> About the scenarios here </h1>
                <p>
                    In many countries, COVID-19 spread so quickly it overwhelmed the capacity 
                    to test for the virus.  This is why when we see <i>confirmed cases</i> rapidly increase, it's hard to tell
                    whether that comes from a real increase in actives cases, incomplete testing, or testing delays.
                </p>
                <p>
                    Might there be a better way to guess at what's happening, even if testing is incomplete?
                    <a href="https://medium.com/@tomaspueyo/coronavirus-act-today-or-people-will-die-f4d3d9cd99ca">
                    Tomas Pueyo's article
                    </a> suggests a way -- we can depend on confirmed death counts to estimate how many 
                    people contracted the virus 2-3 weeks before each death.  Many countries focus testing 
                    efforts on the most severe cases, so death counts are likely closer to being accurate.
                </p>
                <p>
                    That's what we try to calculate on this page -- what might have happened in the past 
                    and what may happen in the future based on actual death counts.
                </p>


                <h1>Scenarios</h1>
                <p>This chart shows your chances of catching COVID-19 in the next year with and without social distancing.
                The strong distancing scenario is based on how quickly the virus spread in Wuhan, after lockdown on January 24, 2020.
                No distancing is based on how quickly the virus spread in Wuhan before January 24th.</p>
        </div>
    }

}


export default AboutModel
