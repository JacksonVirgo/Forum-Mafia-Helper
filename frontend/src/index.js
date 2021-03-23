import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom';
import './css/main.css';

// Pages
import Main from './pages/Main.js';
import NotFoundPage from './pages/404.js';
import Replacement from './components/pages/Replacement.jsx';
import VoteCount from './components/pages/VoteCount.jsx';
class Doc extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}
	render() {
		return (
			<>
				<Router>
					<Switch>
						<Route exact path='/' component={Main} />
						<Route exact path='/replacement' component={Replacement} />
						<Route exact path='/votecount' component={VoteCount} />
						<Route exact path='/test' component={VoteCount} />

						<Route path='/404' component={NotFoundPage} />
						<Redirect to='/404' />
					</Switch>
				</Router>
			</>
		);
	}
}
ReactDOM.render(<Doc />, document.getElementById('root'));
