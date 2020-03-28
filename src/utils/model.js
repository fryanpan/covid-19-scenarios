import moment from 'moment';
import { BasicDiseaseModelScenario } from './basicDiseaseModel';
import {LocationManager} from "../utils/locationManager"

/** Scenarios list that we're running */
const BASE_SCENARIO = {
  rBefore: 2.5,
  cfrBefore: 0.014,
  rAfter: 2.5,
  cfrAfter: 0.014
}

export const PresetCategories  = {
  WORLD: "world" // comparisons around the world
}

/** Scenario data can be either an Object that overrides BASE_SCENARIO, or a function that modifies it */
export const PresetScenarios = new Map([
  ["hubeiStrongFlattening", {
    category: PresetCategories.WORLD,
    name: "Hubei, China",
    rBefore: 2.2,
    thresholdDate: moment("2020-01-24").toDate(),
    rAfter: 0.4,
    country: "China",
    state: "Hubei"
  }],
  ["southKoreaStrongFlattening", {
    category: PresetCategories.WORLD,
    name: "South Korea",
    rBefore: 2.2,
    thresholdDate: moment("2020-01-24").toDate(),
    rAfter: 0.4,
    country: "South Korea",
    state: "All"
  }],
]);

/** Represents a set of model inputs to run */
export class ModelInputs {
    constructor() {
        this.age = 45;
        this.country = "United States";
        this.state = "California";
        this.flatteningDate = moment("2020-03-19").toDate();
        this.scenario = "current"; // @TODO get rid of this
        this.rAfter = 0.4;
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
  static initWithData(queryData) {
    this.modelInputs = new ModelInputs();
    this.scenarios = {};
    this.historicalData = queryData;

    this.presetScenarios = this.generatePresetScenarios();
    this.presetDisplayData = {};
    for(let key in this.presetScenarios) {
      this.presetDisplayData[key] = this.presetScenarios[key].getDisplayData();
    }

    this.updateModelInputs(this.modelInputs);
  }

  static getDailyData(country, state) {
    const dailyData = this.historicalData.allDailyDataCsv.nodes.filter(x => {
      return x.country === country && x.state === state;
    }).map(x => {
      return {
        date: x.date,
        confirmedCases: parseFloat(x.confirmedCases),
        confirmedDeaths: parseFloat(x.confirmedDeaths)
      }
    });

    if(dailyData.length == 0) {
      alert("Unable to find data for country ", country, " and state/province ", state);
      return [];
    }
    return dailyData;
  }

  /** Runs the preset scenarios once.  These are not affected by model parameter changes */
  static generatePresetScenarios() {
    var result = {};
    for(let [key, presetData] of PresetScenarios.entries()) {
      const scenarioData = {...BASE_SCENARIO};

      // Make modifications
      Object.assign(scenarioData, presetData);

      // Special case to pull in Wuhan data for now
      const { country, state } = scenarioData;
      const dailyData = this.getDailyData(country, state);
      const population = LocationManager.lookupLocation(country, state).population;  

      // Run the scenario
      console.log("Running preset scenario ", JSON.stringify(scenarioData));
      result[key] = new BasicDiseaseModelScenario(
        scenarioData.category,
        scenarioData.name,
        dailyData,
        population,
        scenarioData.rBefore,
        scenarioData.cfrBefore,
        scenarioData.rAfter,
        scenarioData.cfrAfter,
        scenarioData.thresholdDate
      );
    }

    console.log("Preset Scenarios", result);
    return result;
  }

  static updateModelInputs(newModelInputs) {
    this.modelInputs = newModelInputs;

    console.log("model.updateModelInputs", newModelInputs);

    const { country, state, rAfter, flatteningDate } = newModelInputs;

    // Load daily data and location data
    const { rInitial, cfrInitial, population } = LocationManager.lookupLocation(country, state);
    const dailyData = this.getDailyData(country, state);
    
    // Create and run the preset scenarios
    // Base scenario.  Construct additional scenarios from this
    const locationScenario = {...BASE_SCENARIO};
    if(rAfter) locationScenario.rAfter = rAfter;
    if(rInitial) locationScenario.rBefore = rInitial;
    if(cfrInitial) locationScenario.cfrBefore = cfrInitial;
    if(flatteningDate) locationScenario.thresholdDate = flatteningDate;

    console.log("Running current scenario ", JSON.stringify(locationScenario));
    const diseaseModel = new BasicDiseaseModelScenario(
      locationScenario.category,
      locationScenario.name,
      dailyData,
      population,
      locationScenario.rBefore,
      locationScenario.cfrBefore,
      locationScenario.rAfter,
      locationScenario.cfrAfter,
      locationScenario.thresholdDate
    );

    this.scenarios = {
      current: diseaseModel 
    };

    return this.scenarios;
  }

  /** Get display data for all scenarios and preset scenarios */
  static getDisplayData() {
    var result = {}
    for(let key in this.scenarios) {
      result[key] = this.scenarios[key].getDisplayData();
    }
    for(let key in this.presetScenarios) {
      result[key] = this.presetDisplayData[key];
    }
    return result;
  }
}

