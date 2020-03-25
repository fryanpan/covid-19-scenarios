import moment from 'moment';
import { BasicDiseaseModelScenario } from './basicDiseaseModel';

/** Scenarios list that we're running */
const BASE_SCENARIO = {
  rBefore: 2.2,
  cfrBefore: 0.014,
  rAfter: 2.2,
  cfrAfter: 0.014,
  thresholdDate: new Date()
}

export const PresetCategories  = {
  BASIC: "basic",
  HAMMER_TIMING: "hammerTiming"
}

/** Scenario data can be either an Object that overrides BASE_SCENARIO, or a function that modifies it */
export const PresetScenarios = new Map([
  ["strongDistancing",  {
    category: PresetCategories.BASIC, 
    name: "Strong Hammer",
    rAfter: 0.4
  }],

  ["moderateDistancing", {
    category: PresetCategories.BASIC,
    name: "Moderate Hammer",
    rAfter: 0.8
  }],

  ["moderateFlattening", {
    category: PresetCategories.BASIC,
    name: "Moderate Flatten",
    rAfter: 1.5
  }],

  ["uncontrolled", {
    category: PresetCategories.BASIC,
    name: "No Controls",
    rAfter: 2.2
  }],

  createHammerTimingScenario("hammerTwoWeeksEarlier", -2, 'week'),
  createHammerTimingScenario("hammer", 0, 'day'),
  createHammerTimingScenario("hammerTwoWeeksLater", 2, 'week'),
  createHammerTimingScenario("hammerOneMonthLater", 1, 'month')
]);

function createHammerTimingScenario(key, numPeriods, periodType) {
  return [key, x => {
    const hammerDate = moment(x.thresholdDate).add(numPeriods, periodType);
    x.name = "Start on " + hammerDate.format("YYYY-MM-DD");
    x.rAfter = 0.4;
    x.category = PresetCategories.HAMMER_TIMING;
    x.thresholdDate = hammerDate.toDate();
  }]
}

/** Represents a set of model inputs to run */
export class ModelInputs {
    constructor() {
        this.age = 45;
        this.country = "United States";
        this.state = "California";
        this.hammerDate = moment("2020-03-17").toDate();
        this.scenario = "strongDistancing";
    }
}

/**
 * Manages the models needed based on the model inputs provided by the user
 */
export class ModelManager {
  /**
   * @todo the query runs right now in index.js, which is inconvenient.  figure out a better way
   * 
   * @param {Object} queryData Result of running the model query
   */
  constructor(queryData) {
    console.log("queryData", queryData);
    this.modelInputs = new ModelInputs();
    this.scenarios = {};
    this.historicalData = queryData;
    this.updateModelInputs(this.modelInputs);
  }

  updateModelInputs(newModelInputs) {
    console.log("model.updateModelInputs", newModelInputs);

    const lookupCountry = newModelInputs.country;
    const lookupState = newModelInputs.state;

    const locationData = this.historicalData.allLocationsCsv.nodes.find(x => {
      return x.country === lookupCountry && x.state === lookupState;
    })    
    locationData.population = parseFloat(locationData.population);

    // Load daily data
    const dailyData = this.historicalData.allDailyDataCsv.nodes.filter(x => {
      return x.country === lookupCountry && x.state === lookupState;
    }).map(x => {
      return {
        date: x.date,
        confirmedCases: parseFloat(x.confirmedCases),
        confirmedDeaths: parseFloat(x.confirmedDeaths)
      }
    });

    if(dailyData.length == 0) {
      alert("Unable to find data for country ", lookupCountry, " and state/province ", lookupState);
      return [];
    }
    
    // Create and run the preset scenarios

    // Base scenario.  Construct additional scenarios from this
    const locationBaseScenario = Object.assign({
      rBefore: parseFloat(locationData.rInitial),
      cfrBefore: parseFloat(locationData.cfrBefore),
      thresholdDate: newModelInputs.hammerDate
    }, BASE_SCENARIO);

    this.scenarios = {};

    for(let [key, scenarioData] of PresetScenarios.entries()) {
      const scenarioClone = {...locationBaseScenario};

      // Make modifications
      if(scenarioData instanceof Function) {
        scenarioData(scenarioClone);
      } else {
        Object.assign(scenarioClone, scenarioData);
      }

      // Run the scenario
      console.log("Running scenario ", JSON.stringify(scenarioClone));
      this.scenarios[key] = new BasicDiseaseModelScenario(
        scenarioClone.category,
        scenarioClone.name,
        dailyData,
        locationData.population,
        scenarioClone.rBefore,
        scenarioClone.cfrBefore,
        scenarioClone.rAfter,
        scenarioClone.cfrAfter,
        scenarioClone.thresholdDate
      );
    }
    return this.scenarios;
  }

  /** Get display data for all scenarios */
  getDisplayData() {
    var result = {}
    for(let key in this.scenarios) {
      result[key] = this.scenarios[key].getDisplayData();
    }
    return result;
  }
}

