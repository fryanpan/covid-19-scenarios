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
  BASIC: "basic",
  FLATTENING_TIMING: "flatteningTiming",
  WORLD: "world" // comparisons around the world
}

/** Scenario data can be either an Object that overrides BASE_SCENARIO, or a function that modifies it */
export const PresetScenarios = new Map([
  ["strongFlattening",  {
    category: PresetCategories.BASIC, 
    name: "Strong Flattening",
    rAfter: 0.4
  }],

  ["moderateFlattening", {
    category: PresetCategories.BASIC,
    name: "Moderate Flattening",
    rAfter: 0.8
  }],

  ["mildFlattening", {
    category: PresetCategories.BASIC,
    name: "Mild Flattening",
    rAfter: 1.5
  }],

  ["noFlattening", {
    category: PresetCategories.BASIC,
    name: "No Flattening",
    rAfter: 2.5
  }],

  createFlatteningTimingScenario("flatteningTwoWeeksEarlier", -2, 'week'),
  createFlatteningTimingScenario("flattening", 0, 'day'),
  createFlatteningTimingScenario("flatteningTwoWeeksLater", 2, 'week'),
  createFlatteningTimingScenario("flatteningOneMonthLater", 1, 'month'),

  ["hubeiStrongFlattening", {
    category: PresetCategories.WORLD,
    name: "Hubei, China",
    rBefore: 2.2,
    thresholdDate: moment("2020-01-24").toDate(),
    rAfter: 0.4
  }]
]);

function createFlatteningTimingScenario(key, numPeriods, periodType) {
  return [key, x => {
    const flatteningDate = moment(x.thresholdDate).add(numPeriods, periodType);
    x.name = "Start on " + flatteningDate.format("YYYY-MM-DD");
    x.rAfter = 0.4;
    x.category = PresetCategories.FLATTENING_TIMING;
    x.thresholdDate = flatteningDate.toDate();
  }]
}

/** Represents a set of model inputs to run */
export class ModelInputs {
    constructor() {
        this.age = 45;
        this.country = "United States";
        this.state = "California";
        this.flatteningDate = moment("2020-03-19").toDate();
        this.scenario = "strongFlattening"; // @TODO get rid of thiss
        this.rAfter = 0.8;
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

  getDailyData(country, state) {
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

  updateModelInputs(newModelInputs) {
    this.modelInputs = newModelInputs;

    console.log("model.updateModelInputs", newModelInputs);

    const lookupCountry = newModelInputs.country;
    const lookupState = newModelInputs.state;

    const locationData = LocationManager.lookupLocation(lookupCountry, lookupState);
    locationData.population = parseFloat(locationData.population);

    // Load daily data
    var dailyData = this.getDailyData(lookupCountry, lookupState);
    
    // Create and run the preset scenarios
    // Base scenario.  Construct additional scenarios from this
    const locationBaseScenario = Object.assign({
      rBefore: parseFloat(locationData.rInitial),
      cfrBefore: parseFloat(locationData.cfrBefore),
      thresholdDate: newModelInputs.flatteningDate
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

      // Special case to pull in Wuhan data for now
      var dailyDataForScenario = dailyData;
      var populationForScenario = locationData.population;
      if(key == "hubeiStrongFlattening") {
        dailyDataForScenario = this.getDailyData("China", "Hubei");
        populationForScenario = LocationManager.lookupLocation("China", "Hubei").population;
      }

      // Run the scenario
      console.log("Running scenario ", JSON.stringify(scenarioClone));
      this.scenarios[key] = new BasicDiseaseModelScenario(
        scenarioClone.category,
        scenarioClone.name,
        dailyDataForScenario,
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

