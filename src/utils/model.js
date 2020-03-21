class ModelInputs {
    constructor() {
        this.age = 45;
        this.country = "US";
        this.state = "";
        this.isSocialDistancing = true;
        this.socialDistancingStartDate = new Date();
    }
}

const ASSUMPTIONS = {
    // From https://www.newyorker.com/news/q-and-a/how-epidemiologists-understand-the-novel-coronavirus
    averageIncubationPeriod: 5,
    averageGenerationTime: 6,
    
    // From https://github.com/midas-network/COVID-19/tree/master/parameter_estimates/2019_novel_coronavirus
    averageTimeToRecovery: 22, 
    averageTimeToDeath: 16,
    
    maxDaysToSimulate: 2000
  }
  
  function incDate(date, incDays) {
    var result = new Date(date);
    result.setDate(result.getDate() + incDays);
    return result;
  }
  
  function createEntry(date, confirmedCases, confirmedDeaths) {
    return {
      date: date,
      confirmedCases: confirmedCases || 0,
      confirmedDeaths: confirmedDeaths || 0,
      newCases: 0,
      newDeaths: 0,
      newRecoveries: 0,
      activeCases: 0,
      totalDeaths: 0,
      totalRecoveries: 0,
      totalCases: 0,
      totalUninfected: 0,
      effectiveReproductionRate: 0,
      testDetectionRate: 0,
      activeRatio: 0
    }
  }
  
  /** 
   * 
   * @param country {String} Country to use
   * @param region {String} Region to use
   * @param dataset {String} Data set to find historical data in (EU or Custom)
   * @param pastR0 {Number} Past basic reproduction number, used to estimate actual cases
   * @param pastCFR {Number} Past case fatality rate, used to estimate actual cases
   * @param futureR0 {Number} Future basic reproduction number, used to estimate future cases
   *
   */
  function BasicDiseaseModel(data, population, pastR0, pastCFR, futureR0, futureCFR) {
   
      const timeToDeath = ASSUMPTIONS.averageTimeToDeath;
      const BLUR_FILTER = [0.4, 0.3, 0.1, 0.1, 0.1];
      const INITIAL_PADDING = BLUR_FILTER.length + 1;
  
      // Fetch historical data
      console.log("Data is ", data.length, " rows of historical data");
      
      // Add additional rows beforehand and after
      var startDate = data[0].date;
      var lastDataDate = data[data.length - 1].date;
      var curDate = data[0].date;
      for(var i = 0; i < ASSUMPTIONS.averageTimeToDeath + INITIAL_PADDING; ++i) {
        curDate = incDate(curDate, -1);
        data.unshift(createEntry(curDate));
      }
      
      const lastDataIndex = data.length - 1;
      
      curDate = lastDataDate;
      for(var i = 0; i < ASSUMPTIONS.daysToSimulate; ++i) {
        curDate = incDate(curDate, 1);
        data.push(createEntry(curDate));
      }
      
      // Setup initial new cases and fuzz them a little for fun
      for(var i = 0; i < data.length; ++i) {
        curDate = data[i].date;
        if(curDate < incDate(lastDataDate, -timeToDeath)) { // estimate based on future deaths
          var futureDeaths = data[i + timeToDeath].confirmedDeaths - data[i + timeToDeath - 1].confirmedDeaths;
          data[i].estimatedNewCases = futureDeaths / pastCFR;
        } else {
          break;
        }
      }
      
      
      console.log("Applying blur function");
      
      // Apply blur to smooth curve a bit
      for(var i = 0; i < data.length; ++i) {
        curDate = data[i].date;
        if(curDate >= incDate(lastDataDate, -timeToDeath)) break;
        
        var iCases = 0;
  
        const bl = BLUR_FILTER.length;
        for(var j = 0; j < BLUR_FILTER.length; ++j) {
          const estNewCases = data[i + j].estimatedNewCases;
          if(estNewCases) {
            iCases += estNewCases * BLUR_FILTER[j];
          }
          data[i].newCases = iCases;
        }
      }
      
      // For each day
      for(var i = 0; i < data.length; ++i) {
        data[i].index = i - lastDataIndex;
        var curDate = data[i].date;
  
        // New cases
        if(curDate >= incDate(lastDataDate, -timeToDeath)) {
          const infectablePopulation = population - data[i-1].totalCases;
          const infectableRatio = infectablePopulation / population;
          
          const R0 = curDate < lastDataDate ? pastR0 : futureR0;
          data[i].effectiveReproductionRate = R0 * infectableRatio;
          
          const historicalIndex = i - ASSUMPTIONS.averageGenerationTime;
          const avgHistoricalNewCases =
              (data[historicalIndex - 1].newCases + data[historicalIndex].newCases + data[historicalIndex + 1].newCases) / 3;
          data[i].newCases = avgHistoricalNewCases * data[i].effectiveReproductionRate;
        }
        
        // New deaths
        // Assume that actual data may be undercounting
        if(i < timeToDeath) {
          data[i].newDeaths = data[i].confirmedDeaths;
        } else {
          const index = i - timeToDeath;
          const CFR = index < lastDataIndex ? pastCFR : futureCFR;
          const estimatedDeaths = data[index].newCases * CFR;
          data[i].newDeaths = Math.max(estimatedDeaths, data[i].confirmedDeaths - data[i-1].confirmedDeaths);
        }
        
        // New recoveries
        if(i >= ASSUMPTIONS.averageTimeToRecovery) {
          const index = i - ASSUMPTIONS.averageTimeToRecovery;
          const CFR = index < lastDataIndex ? pastCFR : futureCFR;
          data[i].newRecoveries = data[index].newCases * (1 - CFR);
        }
        
        // Update cumulative data
        if(i > 0) {
          data[i].activeCases = data[i-1].activeCases + data[i].newCases - data[i].newDeaths - data[i].newRecoveries;        
          data[i].totalDeaths = data[i-1].totalDeaths + data[i].newDeaths;        
          data[i].totalRecoveries = data[i-1].totalRecoveries + data[i].newRecoveries;
          data[i].totalCases = data[i-1].totalCases + data[i].newCases;
        }
        data[i].totalUninfected = population - data[i].totalCases;
        data[i].testDetectionRate = data[i].confirmedCases / data[i].totalCases;
        data[i].activeRatio = data[i].activeCases / population * 1000000;
      }
      
      return data;
  }
    

export default {
    ModelInputs: ModelInputs,
    BasicDiseaseModel: BasicDiseaseModel
}