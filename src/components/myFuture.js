import { StaticQuery, graphql} from "gatsby"
import React from "react"
import * as d3Format from "d3-format"
import { scaleLog } from 'd3-scale';
import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, LabelList
} from 'recharts';

const log10Scale = scaleLog().base(10);

function readableNumber(x) {
    return d3Format.format(",.2r")(x);
}

function nextPowerOf10(x) {
    return Math.pow(10, Math.ceil(Math.log10(x)));
}

class MyFuture extends React.Component {
    /** Computes useful stats based on a single scenario */
    computeStats(scenario) {
        const covidFatalityByAge = this.props.fatalityByAge;
        const micromortsByAge = this.props.micromortsByAge;
        const sampleMicromorts = this.props.sampleMicromorts;

        const modelInputs = this.props.modelInputs;

        var result = {};

        const currentDayIndex = scenario.summary.currentDayIndex;
        const currentDay = scenario.dailyData[currentDayIndex];
        const monthLaterDay = scenario.dailyData[currentDayIndex + 30];
        const endDay = scenario.dailyData[scenario.dailyData.length - 1];
        const population = scenario.scenario.population;

        const monthCatchProbability = (monthLaterDay.totalInfected - currentDay.totalInfected) / population * 1000000;
        const endCatchProbability = (endDay.totalInfected - currentDay.totalInfected) / population * 1000000;

        result.catchCovid = {
            month: monthCatchProbability,
            year: endCatchProbability
        }


        const fatalityEntry = covidFatalityByAge.find(x => parseFloat(x.age) === modelInputs.age);
        const fatalityRate = fatalityEntry ? fatalityEntry.fatalityRate : 0;
        const monthDeathProbability = monthCatchProbability * fatalityRate;
        const endDeathProbability = endCatchProbability * fatalityRate;

        result.dieFromCovid = {
            month: monthDeathProbability,
            year: endDeathProbability
        }

        return result;
    }    
    render() {
        const scenarios = this.props.modelData;
        const isSocialDistancing = this.props.modelInputs.isSocialDistancing;

        var stats = {};
        for(let scenarioKey in scenarios) {
            stats[scenarioKey] = this.computeStats(scenarios[scenarioKey]);
        }

        const catchCovidData = [
            {
                label: "In the next month",
                probability: stats.current.catchCovid.month

            },
            {
                label: "In the next year",
                probability: stats.current.catchCovid.year
            }
        ]
        const catchCovidDomain =  [0, Math.min(Math.pow(10, Math.ceil(Math.log10(stats.current.endCatchProbability, 10))), 1000000)];

        const dieFromCovidData = [
            {
                label: "In the next month",
                probability: stats.current.dieFromCovid.month
            },
            {
                label: "In the next year",
                probability: stats.current.dieFromCovid.year
            }
        ]

        const dieFromCovidDomain =  [0, Math.min(Math.pow(10, Math.ceil(Math.log10(stats.current.endDeathProbability, 10))), 1000000)];

        const socialDistancingData = [
            {
                label: "Strong distancing, R=" + scenarios.strongDistancing.scenario.rAfter,
                probability: stats.strongDistancing.catchCovid.year
            },
            {
                label: "No distancing, R=" + scenarios.noDistancing.scenario.rAfter,
                probability: stats.noDistancing.catchCovid.year
            }
        ]

        const socialDistanceTimingData = [
            {
                label: scenarios.twoWeekEarlierDistancing.scenario.thresholdDate,
                probability: stats.twoWeekEarlierDistancing.catchCovid.year
            },
            {
                label: scenarios.strongDistancing.scenario.thresholdDate,
                probability: stats.strongDistancing.catchCovid.year
            },
            {
                label: scenarios.twoWeekLaterDistancing.scenario.thresholdDate,
                probability: stats.twoWeekLaterDistancing.catchCovid.year
            },
            {
                label: scenarios.monthLaterDistancing.scenario.thresholdDate,
                probability: stats.monthLaterDistancing.catchCovid.year
            }
        ]

        // insert some sample values from micromorts
        
        return <div>
            <h1>
                What does my future look like?
            </h1>

            <h2>How likely is it for me to catch COVID-19?</h2>
            <BarChart
                layout="vertical"
                width={600}
                height={180}
                data={catchCovidData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 20,
                }}
            >
                <XAxis type="number" domain={[ 0, nextPowerOf10 ]}>
                    <Label value="in a million chance" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis dataKey="label" type="category" width={200}/>
                <Bar type="monotone" dataKey="probability"  fill="#8884d8">
                    <LabelList dataKey="probability" position="right" formatter={readableNumber}/>
                </Bar>
            </BarChart>

            <h2>
                How likely is it for me to die from COVID-19?
            </h2>
            <BarChart
                layout="vertical"
                width={600}
                height={180}
                data={dieFromCovidData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 20,
                }}
            >
                <XAxis type="number" domain={[ 0, nextPowerOf10 ]}>
                    <Label value="in a million chance" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis dataKey="label" type="category" width={200}/>
                <Bar type="monotone" dataKey="probability"  fill="#8884d8">
                    <LabelList dataKey="probability" position="right" formatter={readableNumber}/>
                </Bar>
            </BarChart>

            TODO: Bring in comparison data from this table and plot samples above.
            <code>
                micromorts	activity
                0.1	    Fly 100 miles
                0.43	Drive 100 miles by car
                0.45	Snowboard for a day
                0.71	Ski for a day
                2	    Bungee jump once
                5	    Go on one scuba dive
                5.6	    Being a 45-year-old for a day (US, female)
                7	    Run a marathon
                8	    One skydive
                12	    Going for a swim (drowning risk)
                16	    Ride 100 miles on a motorbike
                19	    Being a 60-year-old for a day (US, Female)
                69	    Being a 75-year-old for a day (US, Female)
                120	    Give birth via natural birth
                170	    Give birth via C-section
                430	    One basejump
                430	    Being born (on the first day)
                826	    Being a 100-year-old for a day (US, Female)
                2840	Attempt to climb the Matterhorn
                37932	Hike down from Everest summit
                100000	Go on a space shuttle flight
           </code>

            <h2>
                How much difference { isSocialDistancing ? "will" : "would" } social distancing make?
            </h2>

            <h3>Chances I will get sick with and without social distancing</h3>
            <p>This chart shows your chances of catching COVID-19 in the next year with and without social distancing.
                The strong distancing scenario is based on how quickly the virus spread in Wuhan, after lockdown on January 24, 2020.
                No distancing is based on how quickly the virus spread in Wuhan before January 24th.</p>
            <BarChart
                layout="vertical"
                width={800}
                height={200}
                data={socialDistancingData}
                margin={{
                    top: 10, right: 100, left: 0, bottom: 20,
                }}
            >
                <XAxis type="number" domain={[ 1, nextPowerOf10 ]}>
                    <Label value="in a million chance" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis dataKey="label" type="category" width={250}/>
                <Bar type="monotone" dataKey="probability"  fill="#8884d8">
                    <LabelList dataKey="probability" position="right" formatter={readableNumber}/>
                </Bar>
            </BarChart>

            <h3>Does it matter when social distancing starts?</h3>
            <p>
                If you are in an area where the virus is spreading rapidly and testing is incomplete, then yes it does matter!
                This chart shows the chance that you will catch COVID-19 with social distancing starting on different dates.  
            </p> 
            <BarChart
                layout="vertical"
                width={800}
                height={400}
                data={socialDistanceTimingData}
                margin={{
                    top: 10, right: 100, left: 0, bottom: 20,
                }}
            >
                <XAxis type="number">
                    <Label value="in a million chance" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis dataKey="label" type="category" width={250}/>
                <Bar type="monotone" dataKey="probability"  fill="#8884d8">
                    <LabelList dataKey="probability" position="right" formatter={readableNumber}/>
                </Bar>
            </BarChart>
        </div>
    }

}

/** Using a static query with a class-based component.  Snippet adapted from here:
 * https://spectrum.chat/gatsby-js/general/is-this-a-good-way-of-using-gatsby-v2s-staticquery-with-react-component-class~d9db7af2-f594-4199-9640-8756f39876d5
 */
export default props => (
    <StaticQuery
      query={ graphql`query {
            allFatalityByAgeCsv {
                nodes {
                    age
                    fatalityRate
                }
            }
            allMicromortsByAgeCsv {
                nodes {
                    age
                    micromortsPerDay
                    gender
                }
            }
            allSampleMicromortsCsv {
                nodes {
                    micromorts
                    activity
                }
            }
        }`}
      render={({ allFatalityByAgeCsv, allMicromortsByAgeCsv, allSampleMicromortsCsv }) => <MyFuture fatalityByAge={allFatalityByAgeCsv.nodes} micromortsByAge={allMicromortsByAgeCsv} sampleMicromorts={allSampleMicromortsCsv} {...props} />}
    />
  )
