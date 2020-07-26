var path = require("path");
var webpack = require("webpack");

module.exports = {
  entry: "./mturk-src/index.js",
  output: {
    path: __dirname,
    filename: "build/bundle.js",
    library: "mephisto-task",
    libraryTarget: "umd",
  },
  devtool: 'source-map',
  resolve: {
    modules: [
      path.resolve('./'),
      path.resolve('./node_modules')
    ]
  },
  target: "web",
  node: {
    net: "empty",
    dns: "empty",
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: { presets: ["@babel/env", "@babel/react", {
                          'plugins': ['@babel/plugin-proposal-class-properties']
        }] },
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
      },
      {
        test: /\.(svg|png|jpe?g|ttf)$/,
        loader: "url-loader?limit=100000",
      },
      {
        test: /\.jpg$/,
        loader: "file-loader",
      },
    ],
  },
};
