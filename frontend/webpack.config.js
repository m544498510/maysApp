const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const merge = require('webpack-merge');
const tsImportPluginFactory = require('ts-import-plugin');

const proxyPath = "http://localhost:8080";

//= ========================================================
//  ENVIRONMENT VARS
//---------------------------------------------------------
const isDevMode = process.env.NODE_ENV === 'development';

let cfg = {
  entry: "./src/index.tsx",
  output: {
    filename: "dist/[name].[chunkhash].js",
    path: path.resolve(__dirname, 'public'),
    publicPath: '/public/',
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".json"],
    alias: {
      "~": path.resolve(__dirname, 'src/'),
    }
  },
  
  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + "/src/index.html"
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: 'dist/[name].[chunkhash].css',
      chunkFilename: 'dist/[name].[chunkhash].css',
    }),
  ],
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.tsx?$/,
        loader: "awesome-typescript-loader",
        options: {
          getCustomTransformers: () => ({
            before: [tsImportPluginFactory({style: true})]
          }),
        },
      },
      
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader"
      },
      {
        test: /\.css$/,
        use: [
          isDevMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: isDevMode ? 'style-loader' : MiniCssExtractPlugin.loader,
            options: isDevMode ? undefined : {
              publicPath: __dirname + "/public/dist",
              hmr: false,
            },
          }, {
            loader: 'css-loader',
          }, {
            loader: 'less-loader',
            options: {
              sourceMap: isDevMode,
              javascriptEnabled: true,
            },
          },
        ],
      },
    
    ],
  },
};

//= ====================================
//  DEVELOPMENT
//-------------------------------------
if (isDevMode) {
  cfg = merge(cfg, {
    mode: 'development',
    devtool: "inline-source-map",
    devServer: {
      watchContentBase: true,
      compress: true, // gzip
      hot: true,
      port: 3000,
      contentBase: './public',
      publicPath: '/public/',
      proxy: {
        '/api': proxyPath,
        '/graphql': proxyPath,
        '/public/asset/*': {
          target: 'http://127.0.0.1:3000',
          pathRewrite: { '/public': '' },
          changeOrigin: true,
          secure: false,
        },
      },
      historyApiFallback: {
        rewrites: [
          {from: /^((?!api|graghql|public).)*$/, to: '/public/index.html'},
        ],
      },
    },
    output: {
      filename: "dist/[name].js"
    },
  });
}

if (!isDevMode) {
  cfg = merge(cfg, {
    mode: 'production',
    optimization: {
      splitChunks: {
        cacheGroups: {
          antd: {
            test: /[\\/](antd)|(rc-)[\\/]/,
            chunks: 'all',
            priority: 9,
          },
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            chunks: 'all'
          },
  
        }
      }
    },
  });
}
module.exports = cfg;
