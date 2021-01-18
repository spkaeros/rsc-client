const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
// const webpack = require('webpack');

module.exports = {
    entry: path.resolve(__dirname, 'index.js'),	
    // entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'pkg'),
        filename: 'rsclassic.js',
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new WasmPackPlugin({
        	path: './pkg',
            crateDirectory: path.resolve(__dirname, "game/static"),
			contentBasePublicPath: '/game/static',
			output: 'rsclassic.wasm'
        }),
        // new babelLoader(),
        // Have this example work in Edge which doesn't ship `TextEncoder` or
        // `TextDecoder` at this time.
        // new webpack.ProvidePlugin({
          // TextDecoder: ['text-encoding', 'TextDecoder'],
          // TextEncoder: ['text-encoding', 'TextEncoder']
        // })
    ],
    mode:'development'
};
