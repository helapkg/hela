/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */

'use strict';

const parseArgv = require('mri');

const { cwd, exit } = process;
const processEnv = process.env;
const processArgv = process.argv;
const platformInfo = `${process.platform}-${process.arch} node-${process.version}`;

function isObject(val) {
  return val && typeof val === 'object' && Array.isArray(val) === false;
}

class Yaro {
  constructor(programName, options) {
    if (isObject(programName) && !options) {
      options = programName; // eslint-disable-line no-param-reassign
      programName = null; // eslint-disable-line no-param-reassign
    }
    if (options && typeof options === 'string') {
      options = { version: options }; // eslint-disable-line no-param-reassign
    }

    const progName = typeof programName === 'string' ? programName : 'cli';

    this.settings = {
      cwd,
      version: '0.0.0',
      singleMode: false,
      allowUnknownFlags: false,
      ...options,
    };

    this.programName = progName;
    this.commands = new Map();
    this.flags = new Map();
    this.examples = [];
    this.isYaro = true;

    this.option('-h, --help', 'Display help message');
    this.option('-v, --version', 'Display version');
  }

  command(rawName, description, config) {
    if (this.settings.singleMode === true) {
      throw new Error('in single mode cannot add commands');
    }

    // todo: `rest` parsing, variadic args and etc
    const [commandName, ...rest] = rawName.split(' ');

    const command = {
      commandName,
      rawName,
      description,
      config: { ...config },
      args: this.createArgs(rest),
      flags: new Map(),
      examples: [],
      aliases: [],
    };

    command.config.alias = [].concat(command.config.alias).filter(Boolean);
    command.aliases = command.config.alias;
    this.currentCommand = command; // todo: reset in action() ?

    this.alias(command.aliases);

    this.commands.set(command.commandName, command);
    return this;
  }

  option(rawName, description, config) {
    const flag = this.createFlag(rawName, description, config);

    if (this.settings.singleMode === true || !this.currentCommand) {
      this.flags.set(flag.name, flag);
    } else {
      this.currentCommand.flags.set(flag.name, flag);
      this.__updateCommandsList();
    }
    return this;
  }

  example(text) {
    if (this.settings.singleMode === true || !this.currentCommand) {
      this.examples.push(text);
    } else {
      this.currentCommand.examples.push(text);
      this.__updateCommandsList();
    }
    return this;
  }

  alias(...aliases) {
    if (!this.currentCommand) {
      throw new Error('cannot set .alias() if there is no command declared');
    }

    const alias = []
      .concat(this.currentCommand.aliases)
      .concat(...aliases)
      .filter(Boolean);

    this.currentCommand.aliases = [...new Set(alias)];
    this.__updateCommandsList();

    return this;
  }

  action(handler) {
    const fn = (...args) => handler(...args);

    this.currentCommand.handler = fn;
    this.__updateCommandsList();

    return Object.assign(fn, this);
  }

  extendWith(inst) {
    const keys = Object.getOwnPropertyNames(inst);
    const tasks = Object.values(inst).filter((x) => x.isHela && x.isYaro);

    if (tasks.length > 0) {
      tasks.forEach((task) => {
        this.merge(this, task);
      });
    }

    if (keys.length >= 10 && inst.isHela && inst.isYaro && inst.extendWith) {
      return this.merge(this, inst);
    }

    return this;
  }

  merge(one, two) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [_, flag] of two.flags) {
      one.option(flag.rawName, flag.description, flag.config);
    }

    two.examples.forEach((example) => {
      one.example(example);
    });

    one.commands.set(two.currentCommand.commandName, two.currentCommand);
    return one;
  }

  version(value) {
    this.settings.version = value || this.settings.version;

    return this;
  }

  showVersion(ret = false) {
    if (ret) {
      return this.settings.version;
    }
    console.log(this.settings.version);
    return this;
  }

  help(handler) {
    this.settings.helpHandler = handler || this.settings.helpHandler;

    return this;
  }

  showHelp(commandName) {
    const sections = this.buildHelpOutput(commandName);

    if (typeof this.settings.helpHandler === 'function') {
      this.settings.helpHandler(sections);
      return this;
    }

    console.log(
      sections
        .map((x) => (x.title ? `${x.title}:\n${x.body}` : x.body))
        .join('\n\n'),
    );
    return this;
  }

  buildHelpOutput(commandName) {
    const sections = [];
    const commands = [...this.commands.values()];

    // it's general help, so include commands
    if (!commandName) {
      const cmdStr = this.settings.defaultCommand ? ' [command]' : ' <command>';
      sections.push({
        title: 'Usage',
        body: `  $ ${this.programName}${commands.length > 0 ? cmdStr : ''} ${
          this.flags.size > 0 ? '[options]' : ''
        }`,
      });

      sections.push(this.createSection('Commands', commands));

      sections.push({
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands
          .slice(0, 2)
          .map((cmd) => `  $ ${this.programName} ${cmd.commandName} --help`)
          .filter(Boolean)
          .join('\n'),
      });
    } else {
      const command = this.commands.get(commandName);
      sections.push({
        title: 'Usage',
        body: `  $ ${this.programName} ${command.commandName} ${
          command.flags.size > 0 ? '[options]' : ''
        }`,
      });
      sections.push({
        title: 'Aliases',
        body: `  ${command.aliases.join(', ').trim()}`,
      });
    }

    const cmd = commandName ? this.commands.get(commandName) : null;
    const flags = [...(commandName ? cmd : this).flags.values()];

    if (flags.length > 0) {
      sections.push(this.createSection('Flags', flags));
    }

    const examples = cmd
      ? cmd.examples
      : this.examples.concat(cmd ? cmd.examples : null).filter(Boolean);

    if (examples.length > 0) {
      sections.push({
        title: 'Examples',
        body: examples
          .map((example) =>
            typeof example === 'function'
              ? example
              : (progName) => `  $ ${progName} ${example}`,
          )
          .map((exampleFn) => exampleFn(this.programName))
          .join('\n'),
      });
    }

    return sections;
  }

  parse(argv = processArgv, options = {}) {
    this.settings = { ...this.settings, options };
    this.result = this.__getResult(argv.slice(2));

    if (this.settings.superLazy) {
      return this.result;
    }

    if (this.result.flags.version) {
      this.showVersion();
      exit(0);
    }

    const cmd = this.__getCommand();

    this.checkHelp(cmd);

    // if here, cmd is found, almost guaranteed?

    const command = this.checkArguments(cmd.command);
    const res = { ...this.result, command };

    [...command.flags.values()].forEach((flag) => {
      flag.names.filter(Boolean).forEach((flagName) => {
        // if (hasOwn(res.flags, flagName)) {
        //   res.flags[flagName] =
        // }
        if (hasOwn(flag.config, 'default')) {
          res.flags[flagName] = flag.config.default;
        }
      });
    });

    // since we can pass alias as "defaultCommand",
    // so we should sync them
    res.commandName = command.commandName;

    this.checkUnknownFlags(command);

    if (this.settings.lazy) {
      return res;
    }

    command.handler(...this.result.args.concat(this.result.flags, res));
    return res;
  }

  checkHelp(cmd) {
    if (this.result.flags.help) {
      const name = cmd && cmd.command && cmd.command.commandName;

      this.showHelp(this.settings.defaultCommand ? '' : name);
      exit(0);
    }
    if (!cmd.found) {
      if (!this.settings.defaultsToHelp) {
        if (this.result.commandName) {
          console.log('Command "%s" not found', this.result.commandName);
        } else {
          this.showHelp();
        }
        exit(1);
      } else {
        this.showHelp();
        exit(0);
      }
    }
  }

  checkArguments(command) {
    const hasRequired = command.args.filter((x) => x.isRequired);
    const hasMultiple = command.args.filter((x) => x.isMultiple);

    if (hasRequired.length > 0 && this.result.args.length === 0) {
      console.log('Missing required arguments');
      exit(1);
    }
    if (hasMultiple.length === 0 && this.result.args.length > 1) {
      console.log(
        'Too much arguments passed, you may want add "..." in command declaration?',
      );
      exit(1);
    }

    return { ...command, hasRequired, hasMultiple };
  }

  checkUnknownFlags(command) {
    const flags = [...this.flags.values()];
    const cmdFlags = command ? [...command.flags.values()] : [];

    // eslint-disable-next-line unicorn/consistent-function-scoping
    const findIn = (arr) => (x) => arr.find((flag) => flag.name === x);
    const keys = Object.keys(this.result.flags);
    const foundInGlobal = keys.filter(findIn(flags));
    const foundInCommand = keys.filter(findIn(cmdFlags));
    const found = foundInGlobal.concat(foundInCommand);

    // todo: bug behavior when allowUnknownFlags: false (default for Yaro)
    if (this.settings.allowUnknownFlags !== true) {
      if (found.length === 0) {
        console.log('Unknown flag(s):', keys);
        exit(1);
      }
    }

    // todo: implement required value of flags

    return command;
  }

  createArgs(args) {
    return args.reduce((acc, arg) => {
      const isRequired = arg.startsWith('<');
      const isRequiredMultiple = arg.startsWith('<...');
      const isOptionalMultiple = arg.startsWith('[...');

      return acc.concat({
        isRequired,
        isOptional: !isRequired,
        isMultiple: isRequiredMultiple || isOptionalMultiple,
        arg,
      });
    }, []);
  }

  createSection(title, arr) {
    const longestName = findLongest(arr.map((x) => x.rawName || x));
    return {
      title,
      body: arr
        .map(
          (x) =>
            `  ${padRight(x.rawName, longestName.length)}  ${x.description}`,
        )
        .join('\n'),
    };
  }

  // from `cac`, MIT
  createFlag(rawName, description, config) {
    const flag = {
      rawName,
      description,
      config: { ...config },
    };
    if (config !== undefined) {
      flag.config.default = config;
    }

    // You may use cli.option('--env.* [value]', 'desc') to support a dot-nested option
    flag.rawName = rawName.replace(/\.\*/g, '');

    flag.negated = false;
    flag.names = removeBrackets(rawName)
      .split(',')
      .map((v) => {
        let name = v.trim().replace(/^-{1,2}/, '');
        if (name.startsWith('no-')) {
          flag.negated = true;
          name = name.replace(/^no-/, '');
        }
        return name;
      })
      .sort((a, b) => (a.length > b.length ? 1 : -1)); // Sort names

    // Use the longese name (last one) as actual option name
    flag.name = flag.names[flag.names.length - 1];

    if (flag.negated) {
      // ? hmmmm? should be false?
      flag.config.default = true;
    }

    if (rawName.includes('<')) {
      flag.required = true;
    } else if (rawName.includes('[')) {
      flag.required = false;
    } else {
      // No arg needed, it's boolean flag
      flag.isBoolean = true;
    }

    return flag;
  }

  __existsAsAlias(name) {
    let found = false;

    // eslint-disable-next-line no-restricted-syntax
    for (const [k, command] of this.commands) {
      if (!k) {
        continue;
      }

      const f = command.aliases.includes(name);

      if (!f) {
        continue;
      }
      found = command;
    }
    return found;
  }

  __getCommand() {
    const res = { found: true };
    let command = null;

    // todo: better error handling and etc
    if (
      !this.commands.has(this.result.commandName) ||
      !this.result.commandName
    ) {
      command = this.__existsAsAlias(this.result.commandName);
      if (!command) {
        res.found = false;
      }
    }

    res.command = command || this.commands.get(this.result.commandName);

    return res;
  }

  __getResult(argv) {
    const flagAliases = {};

    [...this.commands.entries()].forEach(([_, cmd]) => {
      [...cmd.flags.entries()].forEach(([flagName, flag]) => {
        flagAliases[flagName] = flag.names;
      });
    });

    const parsed = parseArgv(argv, {
      alias: {
        h: 'help',
        v: 'version',
        ...flagAliases,
      },
    });

    const parsedArgv = { ...parsed };
    const rawArgs = parsed._;
    delete parsed._;

    const flags = { ...parsed };

    const cmdName = rawArgs.slice(0, 1)[0];
    const args = rawArgs.slice(1);
    const idx = args.findIndex((x) => x === '--');
    const argsBefore = args.slice(0, idx - 1);
    const argsAfter = args.slice(idx - 1);

    const name = rawArgs.length > 0 ? cmdName : this.settings.defaultCommand;
    const result = {
      commandName: name,
      parsedArgv,
      rawArgs,
      flags,
    };

    if (idx > -1 && this.settings['--']) {
      result.args = argsBefore;
      result['--'] = argsAfter;
    } else {
      result.args = args;
    }

    return result;
  }

  __updateCommandsList() {
    this.commands.delete(this.currentCommand.commandName);
    this.commands.set(this.currentCommand.commandName, this.currentCommand);

    return this;
  }
}

function hasOwn(obj, val) {
  return Object.prototype.hasOwnProperty.call(obj, val);
}
function removeBrackets(val) {
  return val && val.replace(new RegExp('[<[].+'), '').trim();
}
function findLongest(arr) {
  const res = arr.sort((a, b) => (a.length > b.length ? -1 : 1));
  return res[0];
}
function padRight(str, length) {
  return str.length >= length
    ? str
    : `${str}${' '.repeat(length - str.length)}`;
}

exports.Yaro = Yaro;
exports.yaro = (...args) => new Yaro(...args);
exports.default = exports.yaro;
module.exports = Object.assign(exports.default, exports, {
  utils: {
    exit,
    cwd,
    processEnv,
    processArgv,
    platformInfo,
    parseArgv,
    isObject,
  },
});
module.exports.default = module.exports;
