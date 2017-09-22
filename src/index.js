const {execute, subscribe} = require('graphql');
const {createServer} = require('http');
const {SubscriptionServer} = require('subscriptions-transport-ws');

const express = require('express');

// This package automatically parses JSON requests.
const bodyParser = require('body-parser');

// This package will handle GraphQL server requests and responses
// for you, based on your schema.
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');

const schema = require('./schema');

const {authenticate} = require('./authentication');

const formatError = require('./formatError');

// 1
const connectMongo = require('./mongo-connector');

const buildDataloaders = require('./dataloaders');

// 2
const start = async () => {
  // 3
  const mongo = await connectMongo();
  var app = express();

  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: {
        dataloaders: buildDataloaders(mongo),
        mongo,
        user}, // This context object is passed to all resolvers.
      formatError,
      schema,
    };
  };

  app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));

  const PORT = 3000;
	const server = createServer(app);
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    passHeader: `'Authorization': 'bearer token-yuri.vyatkin@waiorapacific.com'`,
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
  }));

	server.listen(PORT, () => {
		SubscriptionServer.create(
			{execute, subscribe, schema},
			{server, path: '/subscriptions'},
		);
		console.log(`Hackernews GraphQL server running on port ${PORT}.`)
	});
};

// 5
start();
