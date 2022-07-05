/* eslint-disable @typescript-eslint/no-var-requires */
const { removeModuleScopePlugin, addWebpackAlias, override } = require('customize-cra')

const path = require('path')
const pRes = path.resolve

module.exports = (config, env) =>
  override(
    removeModuleScopePlugin(),
    addWebpackAlias({ react: pRes('./node_modules/react'), 'react-dom': pRes('./node_modules/react-dom') }),
  )(config, env)
