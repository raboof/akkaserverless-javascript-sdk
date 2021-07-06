/*
 * Copyright 2021 Lightbend Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Long from 'long';
import * as chai from 'chai';
import {
  StaticAnySupport,
  serialize,
  deserialize,
} from '../src/static-protobuf-any';
import { Example } from './proto/example_pb';

const should = chai.should();
// const should = require('chai').should();
// const protobuf = require('protobufjs');
// const path = require('path');
// const AnySupport = require('../src/protobuf-any');
// const Long = require('long');

// const root = new protobuf.Root();
// root.loadSync(path.join(__dirname, 'example.proto'));
// const anySupport = new AnySupport(root);
// const Example = root.lookupType('com.example.Example');
// const PrimitiveLike = root.lookupType('com.example.PrimitiveLike');

const staticAnySupport = new StaticAnySupport();

describe('AnySupport', () => {
  it('should support serializing strings', () => {
    const serialized = serialize('foo', true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/string');
    deserialize(serialized)?.should.equal('foo');
  });

  it('should support serializing empty string (default)', () => {
    const serialized = serialize('', true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/string');
    serialized.getValue().should.have.lengthOf(0); // empty bytes
    deserialize(serialized)?.should.equal('');
  });

  it('should support serializing long', () => {
    const value = Long.fromNumber(2789);
    const serialized = serialize(value, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/int64');
    deserialize(serialized)?.should.eql(value);
  });

  it('should support serializing zero long (default)', () => {
    const serialized = serialize(Long.fromNumber(0), true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/int64');
    serialized.getValue().should.have.lengthOf(0); // empty bytes
    deserialize(serialized)?.should.eql(Long.ZERO);
  });

  it('should support serializing bytes', () => {
    const bytes = Buffer.from('foo');
    const serialized = serialize(bytes, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/bytes');
    deserialize(serialized)?.should.eql(bytes);
  });

  it('should support serializing empty bytes (default)', () => {
    const bytes = Buffer.alloc(0);
    const serialized = serialize(bytes, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/bytes');
    serialized.getValue().should.have.lengthOf(0); // empty bytes
    deserialize(serialized)?.should.eql(bytes);
  });

  it('should support serializing booleans', () => {
    const serialized = serialize(true, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/bool');
    deserialize(serialized)?.should.equal(true);
  });

  it('should support serializing false booleans (default)', () => {
    const serialized = serialize(false, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/bool');
    serialized.getValue().should.have.lengthOf(0); // empty bytes
    deserialize(serialized)?.should.equal(false);
  });

  it('should support serializing numbers', () => {
    const serialized = serialize(1.2345, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/double');
    deserialize(serialized)?.should.equal(1.2345);
  });

  it('should support serializing zero numbers (default)', () => {
    const serialized = serialize(0, true, false);
    serialized.getTypeUrl().should.equal('p.akkaserverless.com/double');
    serialized.getValue().should.have.lengthOf(0); // empty bytes
    deserialize(serialized)?.should.equal(0);
  });

  it('should support serializing valid protobufs', () => {
    const obj = new Example();
    obj.setField1('foo');
    obj.setField2('bar');
    const serialized = serialize(obj, false, false);
    serialized.getTypeUrl().should.equal('type.googleapis.com/com.example.Example');
    const deserialized = deserialize(serialized);
    deserialized.should.include(obj);
  });

  // it('should not support serializing primitives when false', () => {
  //   (() => AnySupport.serialize('foo', false, false)).should.throw();
  // });

  // it('should not support serializing primitives when false and fallback to json is true', () => {
  //   (() => AnySupport.serialize('foo', false, true)).should.throw();
  // });

  // it('should not support serializing ordinary objects when primitives false', () => {
  //   (() =>
  //     AnySupport.serialize({ field1: 'foo' }, false, false)).should.throw();
  // });

  // it('should not support serializing ordinary objects when primitives true and fallback to JSON is not', () => {
  //   (() => AnySupport.serialize({ field1: 'foo' }, true, false)).should.throw();
  // });

  // it('should support deserializing primitives when the field in not present', () => {
  //   anySupport
  //     .deserialize({
  //       type_url: 'p.akkaserverless.com/string',
  //       value: PrimitiveLike.encode({}).finish(),
  //     })
  //     .should.equal('');
  // });

  // it('should support deserializing primitives when other fields are present', () => {
  //   anySupport
  //     .deserialize({
  //       type_url: 'p.akkaserverless.com/string',
  //       value: PrimitiveLike.encode({
  //         field1: 'one',
  //         field2: 'two',
  //         field3: 'three',
  //       }).finish(),
  //     })
  //     .should.equal('one');
  // });

  // it('should support serialization json when allowed', () => {
  //   const obj = {
  //     type: 'MyType',
  //     field1: 'foo',
  //     field2: 'bar',
  //   };
  //   const serialized = AnySupport.serialize(obj, false, true);
  //   serialized.type_url.should.equal('json.akkaserverless.com/MyType');
  //   anySupport.deserialize(serialized).should.include(obj);
  // });

  // it('should support serialization json with no type property', () => {
  //   const obj = {
  //     field1: 'foo',
  //     field2: 'bar',
  //   };
  //   const serialized = AnySupport.serialize(obj, false, true);
  //   serialized.type_url.should.equal('json.akkaserverless.com/object');
  //   anySupport.deserialize(serialized).should.include(obj);
  // });

  // it('should not support serializing to JSON when not configured', () => {
  //   (() =>
  //     AnySupport.serialize(
  //       { type: 'MyType', field1: 'foo' },
  //       false,
  //       false,
  //     )).should.throw();
  // });

  // it('should fail to serialize to JSON when no type property is present but is required', () => {
  //   (() =>
  //     AnySupport.serialize(
  //       { field1: 'foo' },
  //       false,
  //       true,
  //       true,
  //     )).should.throw();
  // });

  // it('should handle deserializing undefined any values', () => {
  //   const serialized = { type_url: 'type.googleapis.com/com.example.Example' };
  //   const deserialized = anySupport.deserialize(serialized);
  //   deserialized.should.be.an.instanceof(Example.ctor);
  //   deserialized.should.be.empty;
  // });
});
