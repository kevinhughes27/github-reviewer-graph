// React
import React from 'react';

// GraphQL
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

const GetRepositoryInfoQuery = gql`
  query {
    repository(owner: "Shopify", name: "partners") {
      pullRequests(last: 40, states: OPEN) {
        nodes {
          title
          author {
            login
          }
          reviewRequests(last: 5) {
            nodes {
              reviewer {
                name
              }
            }
          }
        }
      }
    }
  }
`;

const withInfo = graphql(GetRepositoryInfoQuery, {
  options: ({ login, name }) => {
    return {
      variables: {
        login: 'facebook',
        name: 'react'
      }
    }
  },
  props: ({ data }) => {
    // loading state
    if (data.loading) {
      return { loading: true };
    }

    // error state
    if (data.error) {
      console.error(data.error);
    }

    // OK state
    return { data };
  },
});

// Repository
class Graph extends React.Component {
  constructor(props) {
    super(props);

    // states
    this.state = {
      reviewers: []
    };
  }

  componentWillReceiveProps(newProps) {
    // DRY
    debugger
    const repo = newProps.data.repositoryOwner.repository;

    // states
    this.setState({
      login: this.props.login,
      name: this.props.name,
      stargazers: repo.stargazers.totalCount,
      watchers: repo.watchers.totalCount
    });
  }

  render() {
    return (<div>
      <h2>{this.state.login}/{this.state.name}</h2>
      <ul>
        <li>stargazers: {this.state.stargazers.toLocaleString()}</li>
        <li>watchers: {this.state.watchers.toLocaleString()}</li>
      </ul>
    </div>)
  }
}

const GraphWithData = withInfo(Graph);
export default GraphWithData;
