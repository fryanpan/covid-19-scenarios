import React from "react"
import Layout from "../components/layout"
import AboutModel from "../components/aboutModel"
import MyInfo from "../components/myInfo"
import MyFuture from "../components/myFuture"
import SimulationDataTable from "../components/simDataTable"
import { ModelManager } from "../utils/model"
import MyCommunity from "../components/myCommunity"

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelManager: new ModelManager(this.props.data)
    }
    this.handleModelInputChange = this.handleModelInputChange.bind(this);
  }

  handleModelInputChange(newModelInputs) {
    this.state.modelManager.updateModelInputs(newModelInputs);

    this.setState(prevState => {
      return {
        modelManager: this.state.modelManager
      }
    });
  }

  render() {
    const modelData = this.state.modelManager.getDisplayData();
    const modelInputs = this.state.modelManager.modelInputs;
    const queryData = this.props.data;

    return <Layout>
      <p>
        Hope you are staying safe.  We are all a part of a pandemic spreading around the world.
        There are so many&nbsp;
        <a href="https://www.covidly.com">charts</a>,&nbsp;  
        <a href="http://gabgoh.github.io/COVID"> disease modeling tools</a>,&nbsp;
        <a href="https://github.com/midas-network/COVID-19/tree/master/parameter_estimates/2019_novel_coronavirus">
          research papers</a>, and news articles.

      </p>
      <p>
        This page hopes to do something different.  It focuses on answering questions that
        are relevant to you and your community. Even though the future is uncertain, it is possible to 
        &nbsp;<a href="https://hbr.org/1997/11/strategy-under-uncertainty">
          guess at plausible scenarios
        </a>.
      </p>

     

      <MyInfo modelInputs={modelInputs} onModelInputChange={this.handleModelInputChange}></MyInfo>

      <AboutModel modelData={modelData}></AboutModel>

      <MyFuture modelData={modelData} modelInputs={modelInputs}></MyFuture>
      <MyCommunity modelData={modelData} modelInputs={modelInputs} historicalData={queryData.allDailyDataCsv.nodes}></MyCommunity>
      <SimulationDataTable modelData={modelData[modelInputs.scenario]}></SimulationDataTable>

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
