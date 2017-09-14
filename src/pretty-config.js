import fs from 'fs'
import path from 'path'
import util from 'util'
import pify from 'pify'
import yaml from 'js-yaml'

const configFiles = [
  '.%src.json', // 1
  '.%src.yaml', // 2
  '.%src.yml', // 3
  '.%src.js', // 4
  '%s.config.js', // 5
  '.%s.config.js', // 6
  '.%src', // 7 - first try JSON, if fail to parse then fallback to YAML
  'package.json', // 8 - pkg.eslint || pkg.eslintConfig || pkg.config.eslint
]

export default function prettyConfig (name, options) {
  return new Promise((resolve, reject) => {
    if (typeof name !== 'string') {
      throw new TypeError('pretty-config: `name` is required argument')
    }
    if (name.length < 1) {
      throw new Error('pretty-config: expect `name` to be non-empty string')
    }

    const opts = Object.assign(
      { cwd: process.cwd(), name: name, configFiles: configFiles },
      options
    )
    const configPath = resolveConfigPath(opts)

    // we return empty object,
    // because we don't have any config
    // and no errors
    if (!configPath) {
      resolve(null)
      return
    }

    const config = resolveConfig(opts, configPath)
    config.then(resolve).catch(reject)
  })
}

function resolveConfigPath (opts) {
  const configFilepath = opts.configFiles.reduce((configPath, fp) => {
    // really, hit fs only once, we don't care
    // if there is more existing config files,
    // we care about the first found one
    if (configPath.length > 0) {
      return configPath
    }

    const resolvePath = (filePath) => path.resolve(opts.cwd, filePath)

    if (fp === 'package.json') {
      fp = resolvePath(fp)
    } else {
      fp = resolvePath(util.format(fp, opts.name))
    }

    if (fs.existsSync(fp)) {
      configPath += fp
    }

    return configPath
  }, '')

  return configFilepath
}

function resolveConfig (opts, configPath) {
  const contents = pify(fs.readFile)(configPath, 'utf8')

  // 1) if `.eslintrc.json`
  if (configPath.endsWith('.json') && !configPath.endsWith('package.json')) {
    return contents.then(JSON.parse)
  }

  // 2) if `.eslintrc.yaml` or `.eslintrc.yml`
  if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
    return contents.then(yaml.safeLoad)
  }

  // 3) if one of those (depends on `configFiles` order):
  // - 3.1) `.eslintrc.js`
  // - 3.2) `eslint.config.js`
  // - 3.3) `.eslint.config.js`
  if (configPath.endsWith('.js')) {
    return Promise.resolve(require(configPath))
  }

  // 4) if `.eslintrc`:
  // - 4.1) try to parse as JSON first, otherwise
  // - 4.2) try to parse as YAML
  if (configPath.endsWith('rc')) {
    return contents.then(JSON.parse).catch((er) => {
      if (er.name === 'SyntaxError') {
        return contents.then(yaml.safeLoad)
      }
      throw er
    })
  }

  // 5) if config in package.json:
  return contents.then(JSON.parse).then(
    (pkg) =>
      // - 5.1) pkg.eslint
      pkg[opts.name] ||
      // - 5.2) pkg.eslintConfig
      pkg[`${opts.name}Config`] ||
      // - 5.3) pkg.config.eslint
      (pkg.config && pkg.config[opts.name]) ||
      // - 5.4) otherwise falsey value
      null
  )
}
