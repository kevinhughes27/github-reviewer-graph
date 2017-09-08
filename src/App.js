// React
import React, { Component } from 'react'

// Apollo
import { ApolloProvider } from 'react-apollo'
import ApolloClient, { createNetworkInterface } from 'apollo-client'

// Auth
import { token } from './config'

// App.Components
import Graph from './Graph'

// Global.Apollo
const networkInterface = createNetworkInterface('https://api.github.com/graphql')

networkInterface.use([
  {
    applyMiddleware (req, next) {
      if (!req.options.headers) {
        req.options.headers = {}
      }

      // Send the login token in the Authorization header
      req.options.headers.authorization = `Bearer ${token}`
      next()
    }
  }
])

const client = new ApolloClient({
  networkInterface
})

export default class App extends Component {
  render () {
    return (
      <ApolloProvider client={client}>
        <Graph />
      </ApolloProvider>
    );
  }
}
