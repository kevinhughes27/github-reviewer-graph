// React
import React from 'react';

// GraphQL
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

import BarChart from 'react-bar-chart';

const Query = gql`
  query {
    repository(owner: "Shopify", name: "partners") {
      pullRequests(last: 50) {
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

    let reviewCounts = {}

    pullRequests.forEach(pr => {
      const reviewRequests = pr.reviewRequests.nodes;
      reviewRequests.forEach(rr => {
        const username = rr.reviewer.login
        reviewCounts[username] = reviewCounts[username] || 0
        reviewCounts[username] += 1
      });

      const reviews = pr.reviews.nodes;
      reviews.forEach(r => {
        const username = r.author.login
        reviewCounts[username] = reviewCounts[username] || 0
        reviewCounts[username] += 1
      });
    });

    this.setState({
      reviewers: reviewCounts
    });
  }

  render() {
    const reviewers = this.state.reviewers;
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const data = Object.keys(reviewers).map(username => {
      return {
        text: username,
        value: reviewers[username]
      };
    });

    return (
      <div>
        <BarChart width={1500}
                  height={500}
                  margin={margin}
                  data={data}/>
      </div>
    )
  }
}

const GraphWithData = withInfo(Graph);
export default GraphWithData;
