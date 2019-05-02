<h1 align="center">TS Deserializable</h1>

<p align="center">
Decorator pattern for deserializing unverified data to an instance of a class in typescript.
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

TS-Deserializable is a typescript library that uses metadata and reflection to deserialize unverified data from an external location (like an XMLHttpRequest request) to an instance of a class with a provided decorator config pattern. Data mapping can be applied to conform data to your classes and fallback values must be given in case data is missing. Logging can occur in various ways to report any missing or invalid data where needed.

## Getting Started

To begin, define a log level of either `ignore`, `warn`, `error`, or `throw` with `@DsClass()`. Then, define how data will map to a classes' properties with `@DsProp()`. 

`@DsClass()` log levels determine where you get notified of missing properties. When a fallback value has to be used, the reporter will either ignore logging it, log a warn message, log an error message, or actually throw an error.

`@DsProp()` chains must always end with a fallback value or `fb()` - even if that value is `undefined`. `@DsProp()` prop chains also provide a few operators for mapping data from objects to your class, see the [API section](#api) for a full list of operators.

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


/* Basic Chaining Example */
@DsClass().warn()
class NumberStringToNumber extends Deserializable {

  @DsProp()
    .dotResolve('someStrings.thisString')
    .map((val) => parseInt(val))
    .validateNumber()
    .fb(0)
  val!: number;
}

const result = new BasicChain().deserialize({ someStrings: { thisString: '42' } });
// result = { val: 42 }

```

## API

### `Deserializable`
> Abstract Class

`Deserializable` is an abstract class that implements the `deserialize(obj: any): any` method. This is the method that ts-deserializable uses for deserializing data. For quick and easy use your classes can `extend` this class. However, if you need to extend another class and want to avoid mixins you can alternatively choose to `implement` it instead. Any logic placed in the implemented `deserialize` method will not be called. 

This class can also be extended or implemented without the use of ts-deserializable decorators and will still be compatible with classes that do.

```Typescript
class User extends Deserializable { ... }

class User implements Deserializable { 
  deserialize(obj: any): any { ... }
}
```

### `@DsClass()`
> Class Decorator

Class operators simply set the log level for any DsProps applied to any child properties of a class instance. A `@DsClass` decorator with a defined log level is required in order for any `@DsProp` decorators to be evaluated.

| Operator | Description |
|----------|-------------|
| `ignore()` | Any undefined values or failed validations will not be logged for this class. |
| `warn()` | Any undefined values or failed validations will be logged as warnings. |
| `error()` | Any undefined values or failed validations will be logged as errors. |
| `throw(errorCtor = Error)` | Any undefined values or failed validations will throw the provided Error. |

### `@DsProp()`
> Property Decorator

There are three types of property operators `basic`, `resolver`, and `validator`. APIs for each of them are listed below. Operators are applied in order and can be chained. No matter what operators are applied to a `@DsProp` chain, the fallback or `fb()` operator is required **at the end** of the chain as it will actually return the built property decorator.

#### Basic Operators

| Operator | Description |
|----------|-------------|
| `fb(fallbackValue: any | Function = undefined)` | The fallback value is returned anytime a prop is not accessible, is undefined, or does not pass validation. If a function is provided, it will be evaluated every time a fallback value is needed. Whatever value a fallback function returns will be passed as the fallback value. |
| `tap(func: Function)` | The provided function is called every time an instance of the class is initialized. |
| `map(func: Function)` | The provided function is passed the value of the matching property from the object being deserialized or the value passed down the chain. If this property does not exist on that object, the event is logged and the fallback value is returned. |
| `mapTo(ctor: Constructor)` | Data for the matching property or passed value is mapped to the deserialize function of the provided constructor. The `mapTo` operator can only be used with other classes implementing the deserializable pattern; they do not need to be using `@DsClass` and `@DsProp` decorators. |

#### Resolver Operators

Resolver operators can be used to resolve structural differences between the object being deserialized and the desired class.

| Operator | Description |
|----------|-------------|
| `resolve(func: Function)` | The provided function is passed the full object being deserialized. Whatever value the function returns is what gets passed along the chain. |
| `dotResolve(propPath: string | string[])` | The propPath param is a "." delimited string or array of prop keys that represents a series of nested props. dotResolve automatically resolves to the value of the prop at the specified location. If the prop does not exist undefined is passed down the chain. |

#### Validator Operators

Validator operators can be used to catch when certain conditions are not met.

| Operator | Description |
|----------|-------------|
| `validate(func: Function)` | Marks the property as invalid if the provided function returns false |
| `validateString()` | Marks the property as invalid if its `typeof` result does not equal `"string"` |
| `validateNumber()` | Marks the property as invalid if its `typeof` result does not equal `"number"` |
| `validateBoolean()` | Marks the property as invalid if its `typeof` result does not equal `"boolean"` |
| `validateArray()` | Marks the property as invalid if it is not an array |


#### TODO

* Create more validators
* Create more operators for common mapping use cases
* Allow for a user provided "deserializable" method that gets called after all prop chains resolve