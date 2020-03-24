import moment from 'moment';
import { BasicDiseaseModelScenario } from './basicDiseaseModel';

/** Represents a set of model inputs to run */
class ModelInputs {
    constructor() {
        this.age = 45;
        this.country = "United States";
        this.state = "California";
        this.isSocialDistancing = true;
        this.hammerDate = new Date();
    }
}

/**
 * Manages the models needed based on the model inputs provided by the user
 */
class ModelManager {
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
    const lookupCountry = newModelInputs.country;
    const lookupState = newModelInputs.state;
    const isSocialDistancing = newModelInputs.isSocialDistancing;
    const locationData = this.historicalData.allLocationsCsv.nodes.find(x => {
      return x.country === lookupCountry && x.state === lookupState;
    })    
    locationData.population = parseFloat(locationData.population);

    const R_STRONG = 0.4;
    const R_MODERATE = 0.7;
    const R_SINGAPORE = 1.2;
    const R_MINIMAL_DISTANCING = 1.8;
    const R_NO_DISTANCING = 2.2;

    const rBefore = parseFloat(locationData.rInitial || R_MINIMAL_DISTANCING);
    const cfrBefore = parseFloat(locationData.cfrInitial || 0.014);
   
    const rAfter = isSocialDistancing ? R_STRONG : R_MINIMAL_DISTANCING;
    const cfrAfter = 0.014;

    const thresholdDate = newModelInputs.hammerDate;

    const dailyData = this.historicalData.allDailyDataCsv.nodes.filter(x => {
      return x.country === lookupCountry && x.state === lookupState;
    }).map(x => {
      return {
        date: new Date(x.date),
        confirmedCases: parseFloat(x.confirmedCases),
        confirmedDeaths: parseFloat(x.confirmedDeaths)
      }
    });

    this.scenarios.current = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, rAfter, cfrAfter, thresholdDate);

    this.scenarios.strongDistancing = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, R_STRONG, cfrAfter, thresholdDate);
    // this.scenarios.moderateDistancing = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, R_MODERATE, cfrAfter, thresholdDate);
    // this.scenarios.singapore = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, R_SINGAPORE, cfrAfter, thresholdDate);
    this.scenarios.noDistancing = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, rBefore, cfrBefore, thresholdDate);
    this.scenarios.twoWeekEarlierDistancing = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, R_STRONG, cfrAfter, moment(thresholdDate).add(-2, 'week').toDate());
    this.scenarios.twoWeekLaterDistancing = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, R_STRONG, cfrAfter, moment(thresholdDate).add(2, 'week').toDate());
    this.scenarios.monthLaterDistancing = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, R_STRONG, cfrAfter, moment(thresholdDate).add(1, 'month').toDate());

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

export default {
    ModelInputs: ModelInputs,
    ModelManager: ModelManager
}