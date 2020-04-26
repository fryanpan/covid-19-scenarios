import React from "react"
import Layout from "../components/layout"
import MyInfo2 from "../components/myInfo2"
import ScenarioView from "../components/scenarioView"
import { ModelManager } from "../utils/model"
import { LocationManager } from "../utils/locationManager"
import moment from "moment"
import ScenarioBar from "../components/scenarioBar"
import { throttle } from 'lodash';
import "./index.css";

// @TODO switch to using React Context instead of global ModelManager object

class IndexPage extends React.Component {
  static MODEL_UPDATE_THROTTLE_TIME = 500;

  constructor(props) {
    super(props);
    // Create a throttled version of the model update
    this.throttledModelUpdate = throttle(this.updateModels.bind(this), IndexPage.MODEL_UPDATE_THROTTLE_TIME);
    // Make sure to do this first, so the data is available elsewhere
    LocationManager.initLocationData(this.props.data.allLocationsCsv.nodes, this.props.data.allDailyDataCsv.nodes);
    ModelManager.initWithData(this.props.data, true);

    this.state = {
      modelManager: ModelManager,
      modelInputs: ModelManager.modelInputs,
      hideText: false
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

    if(key === "country" || key === "state") {
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

  hideText() {
    this.setState(prevState => {
        return {
            hideText: !prevState.hideText
          };
    })
  }

  render() {
    const modelData = this.state.modelManager.getDisplayData();
    const modelInputs = this.state.modelInputs;
    const queryData = this.props.data;

    const lastDataDate = queryData.allDailyDataCsv.nodes.reduce((prev, cur) => {
      const curDate = moment(cur.date).format("YYYY-MM-DD");
      if(curDate > prev) return curDate;
      return prev;
    }, "2019-01-01");

    return <Layout>
      <div className={this.state.hideText ? "hideText" : "showText"}>
        <ScenarioBar modelInputs={modelInputs}
          minScroll={50} 
          onModelInputChange={this.handleModelInputChange}></ScenarioBar>

        <MyInfo2 modelInputs={modelInputs} onModelInputChange={this.handleModelInputChange}></MyInfo2>

        <p>Data will be updated daily (last update on {lastDataDate}).<br/>
        </p>

        <ScenarioView modelInputs={modelInputs} modelData={modelData} onModelInputChange={this.handleModelInputChange}></ScenarioView>
      </div>
      <h1>Acknowledgements</h1>

      <p>
      Thank you to Fish, Joanna, and Ahon for providing amazing feedback.
      </p>

      <h1>About</h1>

      <p>
      Please let me know if you have any questions or suggestions <a href="mailto:fryanpan@gmail.com">by email</a>.<br/>
      The code and data for this site are on Github <a href="https://github.com/fryanpan/covid-19-scenarios">here</a>.      
      </p>

      {/* @TODO Make this page more shareable -- keep your personal choices and make it possible to send a link

      @TODO Add more detail about the model -- it's an SEIR model, with some tweaks to simulate
      a short period when infected people are infectious.  Quantized daily, using box filters
      to simulate transmission.  Yes, it would be better to solve the continuous differential equations, 
      but given how much uncertainty there is in the inputs, the mistakes introduced by having a shitty 
      model implementation probably don't matter.  I spent more time focusing on the insight
      than the math.  The math needed to be close enough. */}
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
