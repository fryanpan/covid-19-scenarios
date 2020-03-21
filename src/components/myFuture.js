import { Link } from "gatsby"
import PropTypes from "prop-types"
import React from "react"
import model from "../utils/model";

class MyFuture extends React.Component {
    /**
     * 
     * @param {Object} props Expects model to contain current model data
     */
    constructor(props) {
        super(props);
    }

    render() {        
        return <div>
            <h1>
                What does my future look like?
            </h1>
        </div>
    }

}


export default MyFuture
