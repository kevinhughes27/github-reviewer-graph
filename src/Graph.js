// React
import React from 'react';

// GraphQL
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import _filter from 'lodash/filter';
import _sortBy from 'lodash/sortBy';

var BarStackChart = require('react-d3-basic').BarStackChart;

const repos = [
  'partners',
  'shopify',
  'billing',
  'appsStore',
  'experts'
]

const Query = gql`
  query {
    repositoryOwner(login:"Shopify") {
      partners: repository(name: "partners") {
        ...repoFields
      }
      shopify: repository(name: "shopify") {
        ...repoFields
      }
      billing: repository(name: "billing") {
        ...repoFields
      }
      appsStore: repository(name: "shopify-app-store") {
        ...repoFields
      }
      experts: repository(name: "talent-store") {
        ...repoFields
      }
    }
  }

  fragment repoFields on Repository {
    pullRequests(last: 100) {
      nodes {
        title
        createdAt
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
    let reviewers = {}

    repos.forEach(repo => {
      const shopify = newProps.data.repositoryOwner
      const pullRequests = shopify[repo].pullRequests.nodes;

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
    const sortedData = _sortBy(data, d => -(d.pending + d.completed))
    const topReviewers = sortedData.slice(0, 20)

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
          data={topReviewers}
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
