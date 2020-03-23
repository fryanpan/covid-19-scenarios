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

class ModelManager {
  /**
   * 
   * @todo the query runs right now in index.js, which is inconvenient.  figure out a better way
   * 
   * @param {Object} queryData Result of running the model query
   */
  constructor(queryData) {
    console.log("queryData", queryData);
    this.modelInputs = new ModelInputs();
    this.scenarios = [];
    this.historicalData = queryData;
    this.updateModelInputs(this.modelInputs);
  }

  updateModelInputs(newModelInputs) {
    const lookupCountry = newModelInputs.country;
    const lookupState = newModelInputs.state;
    const locationData = this.historicalData.allLocationsCsv.nodes.find(x => {
      return x.country === lookupCountry && x.state === lookupState;
    })    
    locationData.population = parseFloat(locationData.population);

    const rBefore = parseFloat(locationData.rInitial || 2.5);
    const cfrBefore = parseFloat(locationData.cfrInitial || 0.0014);
    const rAfter = 0.4;
    const cfrAfter = 0.0014;
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

    this.diseaseModel = new BasicDiseaseModelScenario(dailyData, locationData.population, rBefore, cfrBefore, rAfter, cfrAfter, thresholdDate);

    return this.diseaseModel;
  }
}

export default {
    ModelInputs: ModelInputs,
    ModelManager: ModelManager
}