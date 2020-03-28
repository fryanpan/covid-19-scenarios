import React from "react"
import Layout from "../components/layout"
import AboutModel from "../components/aboutModel"
import MyInfo from "../components/myInfo"
import MyFuture from "../components/myFuture"
import SimulationDataTable from "../components/simDataTable"
import { ModelManager } from "../utils/model"
import MyCommunity from "../components/myCommunity"
import { LocationManager } from "../utils/locationManager"
import moment from "moment"
import ScenarioBar from "../components/scenarioBar"
import { throttle } from 'lodash';

// @TODO switch to using React Context instead of global ModelManager object

class IndexPage extends React.Component {
  static MODEL_UPDATE_THROTTLE_TIME = 300;

  constructor(props) {
    super(props);
    // Create a throttled version of the model update
    this.throttledModelUpdate = throttle(this.updateModels.bind(this), IndexPage.MODEL_UPDATE_THROTTLE_TIME);
    // Make sure to do this first, so the data is available elsewhere
    LocationManager.initLocationData(this.props.data.allLocationsCsv.nodes, this.props.data.allDailyDataCsv.nodes);
    ModelManager.initWithData(this.props.data);

    this.state = {
      modelManager: ModelManager,
      modelInputs: ModelManager.modelInputs 
      // @TODO fix this mess...it's here because we're throttling model manager updates 
    }
    this.handleModelInputChange = this.handleModelInputChange.bind(this);

  }

  /**
   * Handles updated location data in a modelInputs
   * 
   * @param {Boolean} changedLocation Whether the location changed 
   */
  handleLocationChange(modelInputs) {
      console.log("UPdating available locations", modelInputs);

      // update states value
      var chosenLocation = LocationManager.lookupLocation(modelInputs.country, modelInputs.state);
      const availableLocations = LocationManager.locationsForCountry(modelInputs.country);

      // Pick a state that works, if it is not one of the existing options
      if(!chosenLocation) {
        chosenLocation = availableLocations[0];
        modelInputs.state = chosenLocation.state;
      } 

      // Get updated flattening date and other model information

      console.log("Changing to flattening date for location", chosenLocation.country, 
          chosenLocation.state, chosenLocation.flatteningDate);

      if(chosenLocation.flatteningDate) {
          modelInputs.flatteningDate = moment(chosenLocation.flatteningDate).toDate();
      } else {
          modelInputs.flatteningDate = moment().toDate();
      }

      console.log("New flattening date", modelInputs.flatteningDate);
  }

  /* Handles a change to the model inputs */
  handleModelInputChange(key, value) {
    // Decide how to change the model inputs

    const newModelInputs = {...this.state.modelManager.modelInputs};

    if (key === "flatteningDate") {
      newModelInputs[key] = new Date(value);
    } else if (key === "age") {
      newModelInputs.age = value === "" ? "" : parseInt(value);
    } else {
      newModelInputs[key] = value;
    }

    if(key == "country" || key == "state") {
      this.handleLocationChange(newModelInputs);
    }

    // update the state now
    this.setState({
      modelInputs: newModelInputs
    })

    // update the model manager later
    this.throttledModelUpdate(newModelInputs);
  }

  updateModels(newModelInputs) {
    // Update the model manager, re-run scenarios, but do it on a throttle! 
    this.state.modelManager.updateModelInputs(newModelInputs);

    // Update the React state
    this.setState(prevState => {
      return {
        modelManager: this.state.modelManager
      }
    });
  }

  render() {
    const modelData = this.state.modelManager.getDisplayData();
    const modelInputs = this.state.modelInputs;
    const queryData = this.props.data;

    return <Layout>
      <ScenarioBar modelInputs={modelInputs} onModelInputChange={this.handleModelInputChange}></ScenarioBar>
      <MyInfo modelInputs={modelInputs} onModelInputChange={this.handleModelInputChange}></MyInfo>

      <AboutModel modelInputs={modelInputs} modelData={modelData} onModelInputChange={this.handleModelInputChange}></AboutModel>

      <MyFuture modelData={modelData} modelInputs={modelInputs}></MyFuture>
      <MyCommunity modelData={modelData} modelInputs={modelInputs} historicalData={queryData.allDailyDataCsv.nodes}></MyCommunity>

      @TODO Add various acknowledgements and info

      @TODO Make this page more shareable -- keep your personal choices and make it possible to send a link

      @TODO Add more detail about the model -- it's an SEIR model, with some tweaks to simulate
      a short period when infected people are infectious.  Quantized daily, using box filters
      to simulate transmission.  Yes, it would be better to solve the continuous differential equations, 
      but given how much uncertainty there is in the inputs, the mistakes introduced by having a shitty 
      model implementation probably don't matter.  I spent more time focusing on the insight
      than the math.  The math needed to be close enough.

      <SimulationDataTable modelData={modelData}></SimulationDataTable>
    </Layout>
  }
}

/** Data used by the model manager @see model.js for ModelManager class */
export const query = graphql`
 query {
   allLocationsCsv {
     nodes {
       country
       state
       population
       rInitial
       cfrInitial
       flatteningDate    
     }
   }
   allDailyDataCsv {
     nodes {
       country
       state
       date
       confirmedCases
       confirmedDeaths
     }
   }
 }
`

export default IndexPage
