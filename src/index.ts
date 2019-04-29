export * from './ds-class.decorator';
export * from './ds-prop.decorator';

export abstract class Deserializable {
  deserialize(obj: any): any { return obj; };
}