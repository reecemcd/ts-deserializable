import { Deserializable, DsClass, DsProp } from "..";
import { validate } from "@babel/types";

let uId = 0;

// Basic fallback examples w/tap
@DsClass().ignore()
class User extends Deserializable {

  @DsProp().fb('')
  name!: string;

  @DsProp().fb(undefined)
  info!: string;

  other!: string;

  @DsProp().tap(() => uId++).fb(() => uId)
  id!: number;
}

// Map examples
@DsClass().ignore()
class Group extends Deserializable {

  @DsProp().map((s) => s + '!').fb('Test')
  title!: string;

  @DsProp().mapTo(User).fb([])
  users!: User[];
}

// Resolver examples
@DsClass().ignore()
class MyFormData extends Deserializable {

  @DsProp().resolve(obj => obj.optionA).fb('')
  option1!: string;

  @DsProp().dotResolve('optionB').fb('')
  option2!: string;

  @DsProp().dotResolve('extras.optionC').fb('')
  option3!: string;

  @DsProp().dotResolve(['extras', 'optionD']).fb('')
  option4!: string;
}

// Validator examples
@DsClass().warn()
class ValidatorTrue extends Deserializable {

  @DsProp().validate(() => true).fb('')
  prop!: string;
}

@DsClass().warn()
class ValidatorFalse extends Deserializable {

  @DsProp().validate(() => false).fb('')
  prop!: string;
}

@DsClass().warn()
class ValidatorString extends Deserializable {

  @DsProp().validateString().fb('')
  prop!: string;
}

@DsClass().warn()
class ValidatorNumber extends Deserializable {

  @DsProp().validateNumber().fb(0)
  prop!: number;
}

@DsClass().warn()
class ValidatorBoolean extends Deserializable {

  @DsProp().validateBoolean().fb(false)
  prop!: boolean;
}

@DsClass().warn()
class ValidatorArray extends Deserializable {

  @DsProp().validateArray().fb([])
  prop!: boolean;
}


// Logging examples
@DsClass().warn()
class WarnExample extends Deserializable {

  @DsProp().fb(0)
  example!: number;
}

@DsClass().error()
class ErrorExample extends Deserializable {

  @DsProp().fb(0)
  example!: number;
}

@DsClass().throw()
class ThrowExample extends Deserializable {

  @DsProp().fb(0)
  example!: number;
}

class FooError extends Error {
  constructor(m: string) { super(m); }
}

@DsClass().throw(FooError)
class ThrowFooExample extends Deserializable {

  @DsProp().fb(0)
  example!: number;
}


// Chaining examples
@DsClass().warn()
class BasicChain extends Deserializable {

  @DsProp()
    .dotResolve('a.b')
    .map((val) => parseInt(val))
    .validateNumber()
    .fb(0)
  val!: number;
}

test('Fallbacks', () => {
  const t1: User = new User().deserialize({ 
    name: 'Bob',
    id: 10
  });

  const t2: User = new User().deserialize({});

  expect(t1.name).toBe('Bob');
  expect(t1.id).toBe(10);
  expect(t2.name).toBe('');
  expect(t2.id).toBe(2);
  expect(t2.info).toBeUndefined();
  expect(t2.other).toBeUndefined();
});

test('Maps', () => {
  const t: Group = new Group().deserialize({ 
    title: 'My Users', 
    users: [new User(), new User()]
  });

  expect(t.title).toBe('My Users!');
  expect(Array.isArray(t.users)).toBe(true);
  expect(t.users[0].name).toBe('');
  expect(t.users[1].name).toBe('');
  expect(t.users[0].id).toBe(3);
  expect(t.users[1].id).toBe(4);
});

test('Resolves', () => {
  const t: MyFormData = new MyFormData().deserialize({
    optionA: 'A',
    optionB: 'B',
    extras: {
      optionC: 'C',
      optionD: 'D'
    }
  });

  expect(t.option1).toBe('A');
  expect(t.option2).toBe('B');
  expect(t.option3).toBe('C');
  expect(t.option4).toBe('D');
});

describe('Validators', () => {

  test('Basic', () => {
    let warnSpy = jest.spyOn(console, 'warn');
    const t1 = new ValidatorTrue().deserialize({ prop: 'A' });
    expect(warnSpy).not.toHaveBeenCalled();
    const t2 = new ValidatorFalse().deserialize({ prop: 'A' });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockClear();
  });
  
  test('String', () => {
    let warnSpy = jest.spyOn(console, 'warn');
    const t1 = new ValidatorString().deserialize({ prop: 'A' });
    expect(warnSpy).not.toHaveBeenCalled();
    const t2 = new ValidatorString().deserialize({ prop: 0 });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockClear();
  });

  test('Number', () => {
    let warnSpy = jest.spyOn(console, 'warn');
    const t1 = new ValidatorNumber().deserialize({ prop: 0 });
    expect(warnSpy).not.toHaveBeenCalled();
    const t2 = new ValidatorNumber().deserialize({ prop: 'A' });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockClear();
  });

  test('Boolean', () => {
    let warnSpy = jest.spyOn(console, 'warn');
    const t1 = new ValidatorBoolean().deserialize({ prop: true });
    expect(warnSpy).not.toHaveBeenCalled();
    const t2 = new ValidatorBoolean().deserialize({ prop: 'A' });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockClear();
  });

  test('Array', () => {
    let warnSpy = jest.spyOn(console, 'warn');
    const t1 = new ValidatorArray().deserialize({ prop: [] });
    expect(warnSpy).not.toHaveBeenCalled();
    const t2 = new ValidatorArray().deserialize({ prop: 'A' });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockClear();
  });
  
});

test('Reporter', () => {
  let warnSpy = jest.spyOn(console, 'warn');
  let errorSpy = jest.spyOn(console, 'error');

  const t1 = new WarnExample().deserialize({});
  const t2 = new ErrorExample().deserialize({});

  expect(warnSpy).toHaveBeenCalled();
  expect(errorSpy).toHaveBeenCalled();

  expect(() => { 
    new ThrowExample().deserialize({})
  }).toThrowError();

  expect(() => { 
    new ThrowFooExample().deserialize({})
  }).toThrowError();

  warnSpy.mockClear();
  errorSpy.mockClear();
});

test('Chaining', () => {
  let warnSpy = jest.spyOn(console, 'warn');

  const t1 = new BasicChain().deserialize({ a: { b: '42' } });

  expect(warnSpy).not.toHaveBeenCalled();
  expect(t1.val).toBe(42);
  warnSpy.mockClear();

  const t2 = new BasicChain().deserialize({});

  expect(warnSpy).toHaveBeenCalled();
  expect(t2.val).toBe(0);
});