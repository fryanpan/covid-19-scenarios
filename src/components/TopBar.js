/** Adapted from https://jsfiddle.net/69z2wepo/260640/ */

/**
 * Takes a parameter minScrollX that says when to start showing the bar
 */
export class TopBar extends React.Component {
    state = { isHide: false };

    hideBar = () => {
       const { isHide } = this.state

       window.scrollY > this.props.minScrollX ?
       !isHide && this.setState({ isHide: true })
       :
       isHide && this.setState({ isHide: false });

    //    this.prev = window.scrollY;
    }

    componentDidMount(){
        window.addEventListener('scroll', this.hideBar);
    }

    componentWillUnmount(){
         window.removeEventListener('scroll', this.hideBar);
    }

    render(){
        const classHide = this.state.isHide ? 'hide' : '';
        return <div className={`topbar ${classHide}`}>topbar</div>;
    }
}