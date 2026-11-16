import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-container card" role="alert">
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => this.setState({ error: null })}>Retry</button>
            <a className="btn btn-ghost" href="/">Home</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
