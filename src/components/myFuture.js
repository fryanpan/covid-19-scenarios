import { StaticQuery, graphql} from "gatsby"
import React from "react"
import {
    BarChart, Bar, XAxis, YAxis, Label, LabelList,
    ResponsiveContainer
} from 'recharts';
import { PresetScenarios, PresetCategories } from '../utils/model';
import { readableNumber, readablePercent } from '../utils/dataUtils'



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

        const monthCatchProbability = (monthLaterDay.totalInfected - currentDay.totalInfected) / population;
        const endCatchProbability = (endDay.totalInfected - currentDay.totalInfected) / population;

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
        const percentFormatter = readablePercent(2);
        const scenarios = this.props.modelData;
        const currentScenario = this.props.modelInputs.scenario;
        const currentScenarioName = scenarios[currentScenario].scenario.name;

        var stats = {};
        for(let scenarioKey in scenarios) {
            stats[scenarioKey] = this.computeStats(scenarios[scenarioKey]);
        }

        /** Get data for the personal COVID-19 chart */
        const currentStats = stats[currentScenario];
        var personalCatchData = [
            {
                label: "In the next month",
                value: currentStats.catchCovid.month
            },
            {
                label: "In the next year",
                value: currentStats.catchCovid.year
            }
        ];
        var personalDieData = [
            {
                label: "In the next month",
                value: currentStats.dieFromCovid.month
            },
            {
                label: "In the next year",
                value: currentStats.dieFromCovid.year
            }
        ];


        /** Get data for graphs that compare across base scenarios */
        var catchCovidData = [];
        var dieFromCovidData = [];
        for(let [key, scenarioData] of PresetScenarios.entries()) {

            if(scenarioData.category != PresetCategories.BASIC) continue;
            

            const scenarioName = scenarioData.name;
            catchCovidData.push({
                label: scenarioName,
                probability: stats[key].catchCovid.year
            });

            dieFromCovidData.push({
                label: scenarioName,
                probability: stats[key].dieFromCovid.year
            });
        }

        /** Get data for graphs tha compare across when the flattening happens */
        var flatteningTimingData = [];
        for(let [key, scenarioData] of PresetScenarios.entries()) {
            const flatteningScenario = scenarios[key].scenario;
            if(flatteningScenario.category != PresetCategories.FLATTENING_TIMING) continue;
            var scenarioName = flatteningScenario.name;

            flatteningTimingData.push({
                label: scenarioName,
                probability: stats[key].catchCovid.year
            });
        }

        // insert some sample values from micromorts
        
        return <div>
            <h1>
                What does my future look like?
            </h1>

            <p>
            This chart shows how likely it is for you to catch COVID-19 with the {currentScenarioName.toLowerCase()} scenario. 
            </p>

            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    layout="vertical"
                    data={personalCatchData}
                    margin={{
                        top: 10, right: 100, left: 0, bottom: 20,
                    }}
                >
                    <XAxis type="number" domain={[0,1]} tickFormatter={readablePercent(0)}></XAxis>
                    <YAxis dataKey="label" type="category" width={200}/>

                    <Bar type="monotone" dataKey="value"  fill="#8884d8">
                        <LabelList dataKey="value" position="right" formatter={readablePercent(1)}/>
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <h2>
                How likely is it for me to die from COVID-19?
            </h2>
            <p>
                This chart shows how likely it is for you to die from COVID-19.  It's based on your age and
                fatality rates from Wuhan.
            </p>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    layout="vertical"
                    data={personalDieData}
                    margin={{
                        top: 10, right: 100, left: 0, bottom: 20,
                    }}
                >
                    <XAxis type="number" domain={[0,0.02]} tickFormatter={readablePercent(2)}></XAxis>
                    <YAxis dataKey="label" type="category" width={200}/>

                    <Bar type="monotone" dataKey="value"  fill="#8884d8">
                        <LabelList dataKey="value" position="right" formatter={readablePercent(1)}/>
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            TODO: Add some bars based on <a href="https://en.wikipedia.org/wiki/Micromort">micromort</a> data

            {/* <h3>How much does it matter when flattening starts?</h3>
            <p>
                If you are in an area where the virus is spreading rapidly and testing is incomplete, then it can matter a lot!
                This chart shows the chance that you will catch COVID-19 over the next year, with 
                &nbsp;{scenarios[currentScenario].scenario.name.toLowerCase()}&nbsp; starting on different dates.  
            </p> 
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    layout="vertical"
                    data={flatteningTimingData}
                    margin={{
                        top: 10, right: 100, left: 0, bottom: 20,
                    }}
                >
                    <XAxis type="number" tickFormatter={readablePercent(1)} />
                    <YAxis dataKey="label" type="category" width={200}/>
                    <Bar type="monotone" dataKey="probability"  fill="#8884d8">
                        <LabelList dataKey="probability" position="right" formatter={(readablePercent(2))}/>
                    </Bar>
                </BarChart>
            </ResponsiveContainer> */}
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
