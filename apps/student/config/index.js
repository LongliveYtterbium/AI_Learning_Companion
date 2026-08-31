const { defineConfig } = require('@tarojs/cli')

module.exports = defineConfig({
  projectName: 'ai-learning-student',
  date: '2026-08-29',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  plugins: [
    '@tarojs/plugin-framework-react',
    '@tarojs/plugin-platform-weapp',
    '@tarojs/plugin-platform-h5'
  ],
  typescript: {
    enableTsLoader: true
  },
  mini: {},
  h5: {}
})
