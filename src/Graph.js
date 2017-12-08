// React
import React from 'react';

// GraphQL
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import _sortBy from 'lodash/sortBy';

const BarStackChart = require('react-d3-basic').BarStackChart;

const renderLag = true; // if false it will render quantity of reviews

const repos = [
  'partners'
]

const Query = gql`
  query {
    repositoryOwner(login:"Shopify") {
      partners: repository(name: "partners") {
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
            comments {
              totalCount
            }
            createdAt
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
          if (rr.reviewer) {
            const username = rr.reviewer.login
            if (username !== pr.author.login) {
              reviewers[username] = reviewers[username] || { pending: 0, completed: 0, comments: 0 }
              reviewers[username]['pending'] += 1
            }
          }
        });

        const reviews = pr.reviews.nodes;
        reviews.forEach(r => {
          const username = r.author.login
          if (username !== pr.author.login) {
            reviewers[username] = reviewers[username] || { pending: 0, completed: 0, comments: 0, lag: 0 }
            reviewers[username]['completed'] += 1
            reviewers[username]['comments'] += r.comments.totalCount

            const elapsedTime = (new Date(r.createdAt) - new Date(pr.createdAt)) / 3600
            reviewers[username]['lag'] += elapsedTime
          }
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
        completed: reviewers[username]['completed'],
        comments: reviewers[username]['comments'],
        lag: reviewers[username]['lag'] / reviewers[username]['completed']
      };
    });

    if (renderLag) {
      return this.renderLag(data)
    } else {
      return this.renderQuantities(data)
    }
  }

  renderQuantities(data) {
    const sortedData = _sortBy(data, d => -(d.pending + d.completed + d.comments))
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
      {
        field: 'comments',
        name: 'Comments'
      },
    ]

    return this.renderChart(topReviewers, chartSeries)
  }

  renderLag(data) {
    const sortedData = _sortBy(data, d => -(d.lag))
    const topReviewers = sortedData.slice(0, 20)

    const chartSeries = [
      {
        field: 'lag',
        name: 'Lag'
      }
    ]

    return this.renderChart(topReviewers, chartSeries)
  }

  renderChart(reviewers, series) {
    return (
      <div style={{textAlign: 'center'}}>
        <h2>Code reviews</h2>
        <BarStackChart
          data={reviewers}
          chartSeries={series}
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
