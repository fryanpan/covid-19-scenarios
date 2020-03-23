import React from "react"
import Layout from "../components/layout"
import MyInfo from "../components/myInfo"
import MyFuture from "../components/myFuture"
import SimulationDataTable from "../components/simDataTable"
import Model from "../utils/model"
import MyCommunity from "../components/myCommunity"

class IndexPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modelManager: new Model.ModelManager(this.props.data)
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
    const modelData = this.state.modelManager.diseaseModel.getDisplayData();
    return <Layout>
      {/* <p>
      Hope you are staying safe.  You've likely already seen many news reports and charts about the 
      <a href="https://www.covidly.com"> pandemic spreading around the world, </a> 
      and tried out carefully designed tools to understand 
      <a href="http://gabgoh.github.io/COVID"> disease propagation scenarios. </a>
      </p>

      <p>
        This site It is first and foremost about you, your friends and family, and where you live.
      </p> */}

      <MyInfo modelInputs={this.state.modelManager.modelInputs} onModelInputChange={this.handleModelInputChange}>
      </MyInfo>
      <MyFuture modelData={modelData}></MyFuture>
      <MyCommunity modelData={modelData}></MyCommunity>
      
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
       hammerDate
       rHammer
       cfrHammer
       danceDate
       rDance
       cfrDance        
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
