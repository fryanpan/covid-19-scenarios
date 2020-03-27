/** Adapted from https://jsfiddle.net/69z2wepo/260640/ */
export class TopBar extends React.Component {
    state = { isHide: false };

    hideBar = () => {
       const { isHide } = this.state

       window.scrollY > 1500 ?
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