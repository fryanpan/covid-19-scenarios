import React from "react"
import Layout from "../components/layout"
import MyInfo from "../components/myInfo"
import MyFuture from "../components/myFuture"
import SimulationDataTable from "../components/simDataTable"
import Model from "../utils/model"

class IndexPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modelInputs: new Model.ModelInputs(),
      modelData: []
    }

    this.handleModelInputChange = this.handleModelInputChange.bind(this);

    this.historicalData = this.props.data;
  }

  handleModelInputChange(newModelInputs) {
    const lookupCountry = newModelInputs.country;
    const lookupState = newModelInputs.state;
    const locationData = this.historicalData.allLocationsCsv.nodes.find(x => {
      return x.country === lookupCountry && x.state === 'All';
    })    
    locationData.population = parseFloat(locationData.population);

    console.log("Location data", locationData);
    const rBefore = parseFloat(locationData.rInitial || 2);
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

    const diseaseModelData = new Model.BasicDiseaseModel(dailyData, locationData.population, rBefore, cfrBefore, rAfter, cfrAfter, thresholdDate);

    this.setState(prevState => {
      const newState = Object.assign(prevState, {
        modelInputs: newModelInputs,
        modelData: diseaseModelData
      });
      return newState;
    });
  }

  render() {
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

      <MyInfo modelInputs={this.state.modelInputs} countries={this.distinctCountries} onModelInputChange={this.handleModelInputChange}>
      </MyInfo>
      <MyFuture models={this.state.modelData}></MyFuture>
      
      <SimulationDataTable modelData={this.state.modelData}></SimulationDataTable>

    </Layout>
  }
}

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
