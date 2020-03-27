import React from "react";
import ScenarioEditingComponent from "./scenarioEditingComponent"
import "./topBar.css"

/** Adapted from https://jsfiddle.net/69z2wepo/260640/ */

/**
 * Takes a parameter minScrollX that says when to start showing the bar
 */
export default class TopBar extends ScenarioEditingComponent  {
    state = { isHide: true };

    hideBar = () => {
       const { isHide } = this.state

       if(window.scrollY > this.props.minScroll) {
           if(isHide) this.setState({ isHide: false });
       } else {
           if(!isHide) this.setState({ isHide: true });
       }
    }

    componentDidMount(){
        window.addEventListener('scroll', this.hideBar);
    }

    componentWillUnmount(){
         window.removeEventListener('scroll', this.hideBar);
    }

    render(){
        const classHide = this.state.isHide ? 'hide' : '';
        return <div className={`topbar ${classHide}`}>{this.props.children}</div>;
    }
}