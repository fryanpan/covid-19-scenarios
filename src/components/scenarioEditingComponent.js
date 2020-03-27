import React from "react"

/* A parent class for all components where inline scenario editing is supported 
 *
 * The component requires a "onModelInputChange" property from the parent to be set
 * Which is a function(key, value) that allows changing one key on the model inputs
 * at a time.
 * 
 * Subclasses can use the convenient "this.handleScenarioEditEvent" to handle events
 */
export default class ScenarioEditingComponent extends React.Component {

    constructor(props) {
        super(props);
        this.handleScenarioEditEvent = this.handleScenarioEditEvent.bind(this);
    }

    /** Pass changes back up to the index page component to update all parts of the page*/
    handleScenarioEditEvent(e) {
        const key = e.target.name;
        const value = e.target.value;
        this.props.onModelInputChange(key, value);
    }

    // Implement this function please!
    render() {
        return <> </>
    }
}