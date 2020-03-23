class ModelInputs {
    constructor() {
        this.age = 45;
        this.country = "United States";
        this.state = "California";
        this.isSocialDistancing = true;
        this.hammerDate = new Date();
    }
}

const ASSUMPTIONS = {
    // Parameters from papers in https://github.com/midas-network/COVID-19/tree/master/parameter_estimates/2019_novel_coronavirus

    // Note, we're approximating continuous dynamics with only daily simulations 
    
    // Time from exposure to onset
    // Lauer S. et. al
    meanIncubationPeriod: 5,
    sdIncubationPeriod: 3,

    // Time from onset to isolation
    // Liu T. et. al.
    meanInfectiousPeriod: 3,
    
    // Time from onset to recovery
    // Dorigatti et al.
    meanTimeToRecovery: 22,
    sdTimeToRecovery: 4,

    // Time from onset to death
    // Jung S et al.
    meanTimeToDeath: 15,
    sdTimeToDeath: 2,
    
    maxDaysToSimulate: 365
  }

  const SIMULATION_STATES = ['susceptible', 'exposed', 'infected', 'infectious', 'recovered', 'dead'];
  const INCUBATION_FILTER = [ 0, 0, 0.05, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05];
  const RECOVERY_FILTER = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.05, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05 ];
  const DEATH_FILTER = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.05, 0.15, 0.6, 0.15, 0.05 ]
  const DEATH_AND_INCUBATION_FILTER = convolute(INCUBATION_FILTER, DEATH_FILTER);

  // Pad with buffer before and after the simulation data to avoid having to check for overflowing array indexes
  const BUFFER_LENGTH = Math.max(DEATH_AND_INCUBATION_FILTER.length, RECOVERY_FILTER.length) + 1;

  function convolute(filter1, filter2) {
    var result = [];
    for(var i = 0; i < filter1.length; ++i) {
      for(var j = 0; j < filter2.length; ++j) {
        const previousValue  = result[i + j] || 0;
        result[i + j] = previousValue + filter1[i] * filter2[j];
      }
    }
    return result;
  }

  /**
   * Applies the given filter on the array, using
   * 
   * array[target][i + j] += array[source][i] * scale * filter[j]
   */
  function incrementWithFilter(array, source, target, i, filter, scale, direction) {
    // console.log("incrementWithFilter", source, target, i, filter, scale, direction);

    const sourceValue = array[i][source];
    for(let j = 0; j < filter.length; ++j) {
      const targetIndex = i + j * direction;
      if(!array[targetIndex][target]) {
        array[targetIndex][target] = 0;
      }
      array[targetIndex][target] += scale * sourceValue * filter[j];
    }
  }

  /** Applies the given state transition by running two filters
   * @param array Array to modify
   * @param source Source key to pull data from
   * @param fromState State to decrement people from
   * @param toState State to increment people to
   * @param i Index at the source array
   * @param filter Box filter to use
   * @param scale Scaling factor to use on the source data
   * @param direction Whether to apply the filter in a forward (+1) or backward direction (-1)
   */
  function stateTransitionWithFilter(array, source, fromState, toState, i, filter, scale, direction) {
    // console.log(`stateTransition source: ${source} fromState: ${fromState} toState: ${toState} i: ${i} filter: ${filter} scale: ${scale} dir: ${direction}`);

    const fromDecKey = fromState + "Dec";
    const toIncKey = toState + "Inc";
    incrementWithFilter(array, source, fromDecKey, i, filter, scale, direction);
    incrementWithFilter(array, source, toIncKey, i, filter, scale, direction);
  }


  /** Setup initial data with extra rows before and after.
   * 
   * Set all days to have everyone in Susceptible state to start 
   */
  function setupData(sourceData, rowsBefore, rowsAfter, susceptible) {
    var result = [];
    var curDate = incDate(sourceData[0].date, -rowsBefore);
    var simIndex = 0;

    console.log("setupData");
    for(let i = 0; i < rowsBefore; ++i) {
      result.push(createEntry(simIndex++, curDate, 0, 0, susceptible));
      curDate = incDate(curDate, 1);
    }
    console.log(result.length);

    for(let j = 0; j < sourceData.length; ++j) {
      // Convert cumulative confirmed cases and death counts to deltas
      const confirmedCasesAdded = sourceData[j].confirmedCases - (j > 0 ? sourceData[j-1].confirmedCases : 0);
      const confirmedDeathsAdded = sourceData[j].confirmedDeaths - (j > 0 ? sourceData[j-1].confirmedDeaths : 0);

      result.push(createEntry(simIndex++, curDate, confirmedCasesAdded, confirmedDeathsAdded, susceptible));
      curDate = incDate(curDate, 1);
    }
    console.log(result.length, rowsAfter);
    

    for(let k = 0; k < rowsAfter; ++k) {
      result.push(createEntry(simIndex++, curDate, 0, 0, susceptible));
      curDate = incDate(curDate, 1);
    }
    console.log(result.length);
    
    return result;
  }

  /** Trims data from the results array */
  function trimData(data, bufferAfter) {
    var start, end;
    for(let i = 0; i < data.length - bufferAfter; ++i) {
      const row = data[i];

      // start where there is some data 
      if(!start && (row.exposedInc > 0 || row.confirmedCasesInc > 0 || row.confirmedDeathsInc > 0)) {
        start = i;
      }

      // find the last row with a change > 1
      SIMULATION_STATES.forEach(state => {
        if(row[state + "Inc"] > 1 || row[state + "Dec"] > 1) {
          end = i;
        }
      })
    }
    if(end == undefined) end = data.length - 1;
    console.log(data.length, start, end);
    return data.slice(start, end + 1);
  }

  
  function incDate(date, incDays) {
    var result = new Date(date);
    result.setDate(result.getDate() + incDays);
    return result;
  }
  
  function createEntry(index, date, confirmedCasesAdded, confirmedDeathsAdded, susceptible) {
    var result = {
      index: index,
      date: date,
      confirmedCasesInc: confirmedCasesAdded || 0,
      confirmedDeathsInc: confirmedDeathsAdded || 0,
      population: susceptible
    };

    SIMULATION_STATES.forEach(state => {
      result[state] = 0;
      result[state + "Inc"] = 0;
      result[state + "Dec"] = 0;
    })
    result.susceptible = susceptible;

    return result;
  }

  
  /** 
   * Implements a basic SEIR model (Susceptible, Exposed, Infected, Removed) model with a few extra states
   * 
   * Susceptible -> Exposed -> Infected -> Removed
   * 
   * These are the substates
   * - Infected
   *     - May be simultaneously "Infectious" (at the beginning of being infected, after onset, but before limiting spread, e.g. for 3 days)
   * 
   * - Removed
   *     - Can be either Recovered or Dead
   * 
   * @param data {Object[]} Array of historical data to use
   * @param population {Number} Population
   * 
   * @param rBefore {Number} Past basic reproduction number, used to estimate actual cases
   * @param cfrBefore {Number} Past case fatality rate, used to estimate actual cases
   * 
   * @param rAfter {Number} Future basic reproduction number, used to estimate future cases
   * @param cfrAfter {Number} Future case fatality rate
   * 
   * @param thresholdDate {Date} Date to switch between past and future
   *
   */
  function BasicDiseaseModel(inputData, population, rBefore, cfrBefore, rAfter, cfrAfter, thresholdDate) {   
      // Setup simulation data

      const originalDataLength = inputData.length;
      const bufferedDataLength = originalDataLength + BUFFER_LENGTH;
      const startSimulatingExposureIndex = bufferedDataLength - BUFFER_LENGTH;

      var data = setupData(inputData, BUFFER_LENGTH, ASSUMPTIONS.maxDaysToSimulate + BUFFER_LENGTH, population);
      console.log("Initial data", data, " with population ", population, " threshold date", thresholdDate, " start simulating exposure index", startSimulatingExposureIndex);

      // Calculate new exposures based on deaths
      for(let i = BUFFER_LENGTH; i < bufferedDataLength; ++i) {
        if(data[i].confirmedDeathsInc > 0) {
          const scale = 1 / cfrBefore;
          stateTransitionWithFilter(data, "confirmedDeathsInc", "susceptible", "exposed", i, DEATH_AND_INCUBATION_FILTER, scale, -1);
        }
        if(i >= startSimulatingExposureIndex) { // reset to zero
          data[i].susceptibleDec = 0;
          data[i].exposedInc = 0;
        }
      }

      console.log("After generating deaths");
      console.log(data);

      // Now run the simulation.  At time step i, we've propagated the effects of all transitions from time steps 0 to i-1
      // Now generate any new transitions and propagate transitions at time i to future times
      for(let j = 0; j < data.length - BUFFER_LENGTH; ++j) {
        const beforeThreshold = data[j].date < thresholdDate;

        // Handle state transitions

        // Handle transitions from exposed to infected
        stateTransitionWithFilter(data, "exposedInc", "exposed", "infected", j, INCUBATION_FILTER, 1, 1);

        // Handle transitions from infected to recovered or dead
        const fatalityRate = beforeThreshold ? cfrBefore : cfrAfter;
        const recoveryRate = 1 - fatalityRate;
        stateTransitionWithFilter(data, "infectedInc", "infected", "recovered", j, RECOVERY_FILTER, recoveryRate, 1);
        stateTransitionWithFilter(data, "infectedInc", "infected", "dead", j, DEATH_FILTER, fatalityRate, 1);

        // Update infectious counts over infectious period
        data[j].infectiousInc += data[j].infectedInc;
        data[j + ASSUMPTIONS.meanInfectiousPeriod].infectiousDec += data[j].infectedInc;

        // update the total counts
        SIMULATION_STATES.forEach(state => {
          const incKey = state + "Inc";
          const decKey = state + "Dec";
          if(j > 0) {
            data[j][state] = data[j-1][state] + data[j][incKey] - data[j][decKey]; 
          }
        });

        // Handle propagation from all currently infectious folks 
        if(j >= startSimulatingExposureIndex) {
          const reproductionRate = beforeThreshold ? rBefore : rAfter;
          const scaledReproductionRate = reproductionRate / ASSUMPTIONS.meanInfectiousPeriod
          const exposed = data[j].infectious * scaledReproductionRate;

          if(data[j+1].exposedInc < exposed) {
            data[j+1].exposedInc = exposed;
            data[j+1].susceptibleDec = exposed;
          }
        }
        
      }
      
      //   data[i].totalUninfected = population - data[i].totalCases;
      //   data[i].testDetectionRate = data[i].confirmedCases / data[i].totalCases;
      //   data[i].activeRatio = data[i].activeCases / population * 1000000;
      // }
      return trimData(data, BUFFER_LENGTH);
  }
    

export default {
    ModelInputs: ModelInputs,
    BasicDiseaseModel: BasicDiseaseModel
}