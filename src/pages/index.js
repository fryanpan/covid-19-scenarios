import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import MyInfo from "../components/myInfo"
import MyFuture from "../components/myFuture"
import Image from "../components/image"
import Model from "../utils/model"

class IndexPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modelInputs: new Model.ModelInputs()
    }

    this.handleModelInputChange = this.handleModelInputChange.bind(this);

    this.historicalData = this.props.data;
    this.distinctCountries = this.historicalData.allLocationsCsv.distinct;
  }

  handleModelInputChange(newModelInputs) {
    this.setState(prevState => {
      return Object.assign(prevState, newModelInputs);
    });
  }

  render() {
    return <Layout>
      <p>
      Hope you are staying safe.  You've likely already seen many news reports and charts about the 
      <a href="https://www.covidly.com"> pandemic spreading around the world, </a> 
      and tried out carefully designed tools to understand 
      <a href="http://gabgoh.github.io/COVID"> disease propagation scenarios. </a>
      </p>
      <p>
        This site aims to answer different questions. It is first and foremost about you, your friends and family, and your home.
      </p>

      <MyInfo modelInputs={this.state.modelInputs} countries={this.distinctCountries} onModelInputChange={this.handleModelInputChange}>
      </MyInfo>
      <MyFuture models={this.state.models}></MyFuture>
      

    </Layout>
  }
}

export const query = graphql`
  query {
    allLocationsCsv {
      nodes {
        Country
        IsSocialDistancing
        PastR0
        PastCFR
        Population
        State
        SocialDistancingStartDate
      }
      distinct(field: Country)
    }
    allDailyDataCsv {
      nodes {
        ConfirmedCases
        ConfirmedDeaths
        Country
        Date
        State
      }
    }
  }
`

export default IndexPage
