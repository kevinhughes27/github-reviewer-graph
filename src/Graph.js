// React
import React from 'react';

// GraphQL
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import _filter from 'lodash/filter';
import _sortBy from 'lodash/sortBy';

var BarStackChart = require('react-d3-basic').BarStackChart;

const Query = gql`
  query {
    repository(owner: "Shopify", name: "partners") {
      pullRequests(last: 100) {
        nodes {
          title
          author {
            login
          }
          reviewRequests(last: 5) {
            nodes {
              reviewer {
                login
              }
            }
          }
          reviews(last: 5) {
            nodes {
              author {
                login
              }
            }
          }
        }
      }
    }
  }
`;

const withInfo = graphql(Query, {
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

    let reviewers = {}

    pullRequests.forEach(pr => {
      const reviewRequests = pr.reviewRequests.nodes;
      reviewRequests.forEach(rr => {
        const username = rr.reviewer.login
        reviewers[username] = reviewers[username] || { pending: 0, completed: 0 }
        reviewers[username]['pending'] += 1
      });

      const reviews = pr.reviews.nodes;
      reviews.forEach(r => {
        const username = r.author.login
        reviewers[username] = reviewers[username] || { pending: 0, completed: 0 }
        reviewers[username]['completed'] += 1
      });
    });

    this.setState({
      reviewers: reviewers
    });
  }

  render() {
    const reviewers = this.state.reviewers;
    const data = Object.keys(reviewers).map(username => {
      return {
        name: username,
        pending: reviewers[username]['pending'],
        completed: reviewers[username]['completed']
      };
    });
    const filteredData = _filter(data, d => d.pending > 1 || d.completed > 1)
    const sortedData = _sortBy(filteredData, d => -(d.pending + d.completed))

    const chartSeries = [
      {
        field: 'pending',
        name: 'Pending'
      },
      {
        field: 'completed',
        name: 'Completed'
      },
    ]

    return (
      <div style={{textAlign: 'center'}}>
        <h2>Code reviews</h2>
        <BarStackChart
          data={sortedData}
          chartSeries={chartSeries}
          x={(d) => d.name}
          xScale={"ordinal"}
          width={1500}
          height={500} />
      </div>
    )
  }
}

const GraphWithData = withInfo(Graph);
export default GraphWithData;
