import { StaticQuery, graphql} from "gatsby"
import React from "react"
import * as d3Format from "d3-format"

import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Label, LabelList
} from 'recharts';

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

        const socialDistanceData = [

            {
                label: "Current scenario",
                probability: stats.current.catchCovid.year
            },
            {
                label: "Distancing after " + scenarios.twoWeekEarlierDistancing.scenario.thresholdDate,
                probability: stats.twoWeekEarlierDistancing.catchCovid.year
            },
            {
                label: "Distancing after " + scenarios.strongDistancing.scenario.thresholdDate,
                probability: stats.strongDistancing.catchCovid.year
            },
            {
                label: "Distancing after " + scenarios.twoWeekLaterDistancing.scenario.thresholdDate,
                probability: stats.twoWeekLaterDistancing.catchCovid.year
            },
            {
                label: "Distancing after " + scenarios.monthLaterDistancing.scenario.thresholdDate,
                probability: stats.monthLaterDistancing.catchCovid.year
            },
            {
                label: "No distancing",
                probability: stats.noDistancing.catchCovid.year
            },
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
                How likely is it for me to die from it?
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

            <h2>
                How much difference will social distancing make?
            </h2>
            <p>Chance that I will catch COVID-19 in the next year
                </p>
            <BarChart
                layout="vertical"
                width={600}
                height={400}
                data={socialDistanceData}
                margin={{
                    top: 10, right: 30, left: 0, bottom: 20,
                }}
            >
                <XAxis type="number" domain={[ 0, nextPowerOf10 ]}>
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
