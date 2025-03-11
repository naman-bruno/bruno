const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
    'http': 'commonjs http',
    'https': 'commonjs https',
    'url': 'commonjs url',
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'events': 'commonjs events',
    '@usebruno/lang': 'commonjs @usebruno/lang'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@usebruno/lang': path.resolve(__dirname, '../bruno-lang')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  optimization: {
    minimize: false
  }
}; 