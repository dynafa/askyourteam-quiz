const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

AWS.config.setPromisesDependency(require('bluebird'));

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.create = (event, context, callback) => {
  const data = JSON.parse(event.body);
  const name = requestBody.name;
  const organisationName = requestBody.organisationName;
  const password = requestBody.password;

  if (typeof userID !== 'number' || typeof name !== 'string' || typeof organisationName !== 'string' || typeof password !== 'string' ) {
    console.error('Validation Failed');
    callback(new Error('Couldn\'t create new Admin user because of validation errors.'));
    return;

  }

  createUser(userInfo(userID, name, organisationName, password))
  .then(res => {
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        message: `Sucessfully submitted candidate with user name ${name}`,
        userId: res.id
      })
    });
  })
  .catch(err => {
    console.log(err);
    callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        message: `Unable to submit candidate with user name ${name}`
      })
    })
  });
};

const createUser = user => {
  console.log('Submitting User');
  const userInfo = {
    TableName: process.env.USERTABLE,
    Item: user,
  };
  return dynamoDb.create(userInfo).promise()
    .then(res=>user);
}

const userInfo = (name, organisationName, password) => {
  return {
    userID: uuid.v1(),
    name: name,
    organisationName: organisationName,
    password: password,
  };
};

module.exports.list = (event, context, callback) => {
  var params = {
      TableName: process.env.USERTABLE,
      ProjectionExpression: "id, name, organisationName"
  };

  console.log("Scanning DynamoDB table for users.");
  const onScan = (err, data) => {

      if (err) {
          console.log('Scan failed to load data. Error JSON:', JSON.stringify(err, null, 2));
          callback(err);
      } else {
          console.log("Scan succeeded.");
          return callback(null, {
              statusCode: 200,
              body: JSON.stringify({
                  users: data.Items
              })
          });
      }

  };

  dynamoDb.scan(params, onScan);

};

module.exports.get = (event, context, callback) => {
  const params = {
    TableName: process.env.USERTABLE,
    Key: {
      name: event.pathParameters.name,
    },
  };

  dynamoDb.get(params).promise()
    .then(result => {
      const response = {
        statusCode: 200,
        body: JSON.stringify(result.Item),
      };
      callback(null, response);
    })
    .catch(error => {
      console.error(error);
      callback(new Error('Couldn\'t fetch candidate.'));
      return;
    });
};