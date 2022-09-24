const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

const CONFIG = {
  mode: 'development',

  module: {
    rules: [
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },
  plugins: [
    new Dotenv({ path: "./.env", safe: true })
  ],
  entry: {
    app: './src/app.js'
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'src'),
    }
  },
  resolve: {
    fallback: {
      "fs": false
    }
  },
};

// This line enables bundling against src in this repo rather than installed module
module.exports = CONFIG;