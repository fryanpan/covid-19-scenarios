import { StaticQuery, graphql} from "gatsby"
import React from "react"
import {
    BarChart, Bar, XAxis, YAxis, Label, LabelList,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import { PresetScenarios, PresetCategories } from '../utils/model';
import { readableNumber, readablePercent, readableRatio, readableOdds } from '../utils/dataUtils'
import * as lodash from 'lodash';

function nextPowerOf10(x) {
    return Math.pow(10, Math.ceil(Math.log10(x)));
}

class MyFuture extends React.Component {
    /** Computes useful stats based on a single scenario */
    computeStats(scenario) {
        const covidFatalityByAge = this.props.fatalityByAge;

        const {age, sex } = this.props.modelInputs;

        const existingDeathProbability = this.findPersonalDeathProbability(age, sex);

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


        const fatalityEntry = covidFatalityByAge.find(x => parseFloat(x.age) === age);
        const fatalityRate = fatalityEntry ? fatalityEntry.fatalityRate : 0;
        const monthDeathProbability = monthCatchProbability * fatalityRate;
        const endDeathProbability = endCatchProbability * fatalityRate;

        result.dieFromCovid = {
            month: monthDeathProbability / existingDeathProbability.month,
            year: endDeathProbability / existingDeathProbability.year,
        }

        result.normalDeathProbability = {
            month: existingDeathProbability.month,
            year: existingDeathProbability.year
        }

        return result;
    }    

    /** Finds related death probabilities given probabilities in values
     * At least one just smaller than and one just larger than each    
     **/
    findRelatedDeathProbabilities(values) {
        const sampleMicromorts = this.props.sampleMicromorts;
        const sortedValues = values.sort();
        const added = new Set();
        var results = [];

        for(let i = 0, j = 0; i < sortedValues.length && j < sampleMicromorts.length - 1;) {
            const last = sampleMicromorts[j].micromorts / 1000000;
            const next = sampleMicromorts[j+1].micromorts / 1000000;
            const value = sortedValues[i];

            if(last <= value && value < next) { // we want to add last and next, if not added
                if(!added.has(j)) {
                    results.push(sampleMicromorts[j])
                    added.add(j);
                }
                if(!added.has(j+1)) {
                    results.push(sampleMicromorts[j+1]);
                    added.add(j+1);
                }
                i++;
            } else {
                j++;
            }
        }
        return results;
    }

    /** Finds related death probabilities given probabilities in values
     * At least one just smaller than and one just larger than each    
     **/
    findRelatedProbabilities(values) {
        const sampleProbabilities = this.props.sampleProbabilities;
        const sortedValues = values.sort();
        const added = new Set();
        var results = [];

        for(let i = 0, j = 0; i < sortedValues.length && j < sampleProbabilities.length - 1;) {
            const last = parseFloat(sampleProbabilities[j].probability);
            const next = parseFloat(sampleProbabilities[j+1].probability);
            const value = sortedValues[i];

            if(last <= value && value < next) { // we want to add last and next, if not added
                if(!added.has(j)) {
                    results.push(sampleProbabilities[j])
                    added.add(j);
                }
                if(!added.has(j+1)) {
                    results.push(sampleProbabilities[j+1]);
                    added.add(j+1);
                }
                i++;
            } else {
                j++;
            }
        }
        return results;
    }

    findPersonalDeathProbability(age, sex) {
        const micromortsByAge = this.props.micromortsByAge;
    
        age = age || 1;
        sex = sex || 'Female'
        const entry = micromortsByAge.find(x => {
            return x.age == age && x.sex == sex
        });

        const perDay = entry.micromortsPerDay / 1000000;
        return {
            day: perDay,
            month: perDay * 365.25 / 12 ,
            year: perDay * 365.25
        }
    }

    render() {
        const { age, sex } = this.props.modelInputs;
        const ratioFormatter = readableRatio(2);
        const numberFormatter = readableNumber(3);
        const scenarios = this.props.modelData;


        /** Compute stats for available scenarios */
        var stats = {};
        for(let scenarioKey in scenarios) {
            stats[scenarioKey] = this.computeStats(scenarios[scenarioKey]);
        }

        /** Get data for the personal COVID-19 chart */
        var personalCatchData = [
            {
                label: "In Next Month",
                value: stats.current.catchCovid.month
            },
            {
                label: "In Next Year",
                value: stats.current.catchCovid.year
            }
        ];
        
        const monthRatio = ratioFormatter(stats.current.dieFromCovid.month);
        const yearRatio = ratioFormatter(stats.current.dieFromCovid.year);
        const yearDieData = [
            {
                label: "Normal Risk",
                value: 1,
                detail: "1x"
            },
            {
                label: "With COVID-19",
                value: stats.current.dieFromCovid.year + 1,
                detail: `${yearRatio} more risk`
            }
        ];


        // insert some sample values from micromorts
        
        return <div>
            <h1>
                What does my future look like?
            </h1>

            <p>
            This chart shows how likely it is for you to catch COVID-19 with your current scenario.  
            You can use the green box above to try different scenarios.  For comparison,
            the chance of getting the flu in a given year is about 1 in 10 (in the US).  
            </p>
         
            <h6 className="chartTitle">Chance of Catching COVID-19</h6>
            <ResponsiveContainer width="100%" height={150}>
                <BarChart
                    layout="vertical"
                    data={personalCatchData}
                    margin={{
                        top: 10, right: 120, left: 0, bottom: 20,
                    }}
                >
                    <XAxis type="number" domain={[0,1]} ticks={[1]} tickFormatter={x => "1 in 1"}></XAxis>
                    <YAxis dataKey="label" type="category" width={140}/>

                    <Bar type="monotone" dataKey="value"  fill="#8884d8">
                        <LabelList dataKey="value" position="right" formatter={readableOdds()} width={100}/>
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <h2>
                How much will COVID-19 increase my risk of dying?
            </h2>
            <p>
                Before COVID-19, you had a {readableOdds()(stats.current.normalDeathProbability.year)}&nbsp; 
                chance of dying in the next year, based on your age and sex (using data from the US Social Security Administration). 
                With COVID-19, your risk of catching the virus and dying increases by this much in your current scenario.  
            </p>
            <h6 className="chartTitle"></h6>
            <ResponsiveContainer width="100%" height={150}>
                <BarChart
                    layout="vertical"
                    data={yearDieData}
                    margin={{
                        top: 0, right: 120, left: 0, bottom: 0,
                    }}
                >
                    <YAxis type="category" dataKey="label" width={140}></YAxis>
                    <XAxis type="number" tickFormatter={readableRatio(1)} ticks={[1]}></XAxis>
                    <Bar type="monotone" dataKey="value"  fill="#8884d8">
                        <LabelList dataKey="detail" position="right"/>
                    </Bar>
                    <ReferenceLine x={1}></ReferenceLine>
                </BarChart>
            </ResponsiveContainer>

            Note that this chart simply adds together the risk of dying from COVID-19 to the normal risk of dying.
            It's not as simple as this, especially for those with serious existing conditions.       
            Also, this chart uses mortality rates by age from the US, which differ from place to place.

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
                    sex
                }
            }
            allSampleMicromortsCsv {
                nodes {
                    micromorts
                    activity
                }
            }
            allSampleProbabilitiesCsv {
                nodes {
                    probability
                    activity
                }
            }
        }`}
      render={({ allFatalityByAgeCsv, allMicromortsByAgeCsv, allSampleMicromortsCsv, allSampleProbabilitiesCsv }) => <MyFuture 
        fatalityByAge={allFatalityByAgeCsv.nodes} 
        micromortsByAge={allMicromortsByAgeCsv.nodes} 
        sampleMicromorts={allSampleMicromortsCsv.nodes} 
        sampleProbabilities={allSampleProbabilitiesCsv.nodes} {...props} />}
    />
  )
