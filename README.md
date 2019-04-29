<h1 align="center">TS Deserializable</h1>

<p align="center">
Decorator pattern for deserializing unverified data to an instance of a class.
</p>

<p align="center">
    <a href="https://github.com/reecemcd/ts-deserializable/blob/master/LICENSE" target="_blank"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="mit license" height="18"></a>
    <a href="https://circleci.com/gh/reecemcd/ts-deserializable" target="_blank"><img src="https://circleci.com/gh/reecemcd/ts-deserializable.svg?style=svg" alt="mit license" height="18"></a>
</p>

## Table of contents
* [Installation](#installation)
* [Description](#description)
* [Getting Started](#getting-started)
* [API](#api)


## Installation

`coming soon...`

## Description

TS-Deserializable is library that uses metadata and reflection to deserialize unverified data from an external location (like an XMLHttpRequest request) to an instance of a class with a provided decorator config pattern. Data mapping can be applied to conform data to your classes and fallback values must be given in case data is missing. Logging can occur in various ways to report any missing data where needed.

## Getting Started

To begin, define a log level of either `ignore`, `warn`, `error`, or `throw` with `@DsClass()`. Then, define how data will map to a classes' properties with `@DsProp()`. 

`@DsClass()` log levels determine where you get notified of missing properties. When a fallback value has to be used, the reporter will either ignore logging it, log a warn message, log an error message, or actually throw an error.

`@DsProp()` chains must always end with a fallback value or `fb()`, even if that value is `undefined`. `@DsProp()` prop chains also provide a few operators for mapping data from objects to your class, see the [API](#api) section for a full list of operators.

#### Quick Examples:

```Typescript
/* Basic fallback example */
@DsClass().ignore()
class User extends Deserializable {

  @DsProp().fb('')
  name: string;

  @DsProp().fb(() => '')
  email: string;

  info: string;
}

const user = new User().deserialize({});
// user == { name: '', email: '' }

/* Map examples */
@DsClass().warn()
class Group extends Deserializable {

  @DsProp().map((s) => s + '!').fb('Test')
  title: string;

  @DsProp().mapTo(User).fb([])
  users: User[];
}

const group = new Group().deserialize({ title: 'My Group' });
// group == { title: 'MyGroup!', users = [ {name: '', email: ''}, { name: '', email: ''} ]}

/* Resolver examples */
@DsClass().error()
class MyFormData extends Deserializable {

  @DsProp().resolve(obj => obj.optionA).fb('')
  option1: string;

  @DsProp().dotResolve('optionB').fb('')
  option2: string;

  @DsProp().dotResolve('extras.optionC').fb('')
  option3: string;

  @DsProp().dotResolve(['extras', 'optionD']).fb('')
  option4: string;
}

const formData = new MyFormData().deserialize({
  optionA: 'A',
  optionB: 'B',
  extras: { optionC: 'C', optionD: 'D' }
});
// formData == { option1: 'A', option2: 'B', option3: 'C', option4: 'D' }

```

## API

coming soon...