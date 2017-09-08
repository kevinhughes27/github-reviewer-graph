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

class Graph extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      reviewers: []
    };
  }

  componentWillReceiveProps(newProps) {
    const repo = newProps.data.repository;
    const pullRequests = repo.pullRequests.nodes;

    let reviewCounts = {}
    pullRequests.forEach(pr => {
      const reviewers = pr.reviewRequests.nodes
      reviewers.forEach(rr => {
        const name = rr.reviewer.name
        reviewCounts[name] = reviewCounts[name] || 0
        reviewCounts[name] += 1
      });
    });

    this.setState({
      reviewers: reviewCounts
    });
  }

  render() {
    const reviewers = this.state.reviewers;

    return (
      <div>
        { Object.keys(reviewers).map(r => `${r}: ${reviewers[r]}`) }
      </div>
    )
  }
}

const GraphWithData = withInfo(Graph);
export default GraphWithData;
