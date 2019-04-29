import { Deserializable, DsClass, DsProp } from "..";

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

test('Fallbacks', async () => {
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

test('Maps', async () => {
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

test('Resolves', async () => {
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

test('Reporter', async () => {
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
});