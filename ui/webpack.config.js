module.exports = {
  module: {
    rules: [
      {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                plugins: [
                  { removeViewBox: false },
                  { removeDimensions: true },
                  { throwIfNamespace: false } // Disable namespace check
                ],
              },
            },
          },
        ],
      },
    ],
  },
};
