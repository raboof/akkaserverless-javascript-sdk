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

const util = require('util');
const protobufHelper = require('../protobuf-helper');
const AnySupport = require('../protobuf-any');

const Clocks =
  protobufHelper.moduleRoot.akkaserverless.component.replicatedentity
    .ReplicatedEntityClock;

/**
 * @classdesc A Replicated Register data type.
 *
 * A ReplicatedRegister uses a clock to determine which of two concurrent updates should win. The
 * last write wins. The clock is represented as a number. The default clock uses the proxies system
 * time, custom clocks can supply a custom number to be used. If two clock values are equal, the
 * write from the node with the lowest address wins.
 *
 * @constructor module:akkaserverless.replicatedentity.ReplicatedRegister
 * @implements module:akkaserverless.replicatedentity.ReplicatedData
 * @param {module:akkaserverless.Serializable} value A value to hold in the register.
 * @param {module:akkaserverless.replicatedentity.Clock} [clock=Clocks.DEFAULT] The clock to use.
 * @param {number} [customClockValue=0] The custom clock value, if using a custom clock.
 */
function ReplicatedRegister(
  value,
  clock = Clocks.DEFAULT,
  customClockValue = 0,
) {
  if (value === null || value === undefined) {
    throw new Error(
      'ReplicatedRegister must be instantiated with an initial value.',
    );
  }
  // Make sure the value can be serialized.
  let serializedValue = AnySupport.serialize(value, true, true);
  let currentValue = value;
  // Always start with the initialized value as the delta, to send this value to the proxy
  let delta = {
    value: serializedValue,
    clock: clock,
    customClockValue: customClockValue,
  };

  /**
   * The value of this register.
   *
   * Setting it will cause it to be set with the default clock.
   *
   * @name module:akkaserverless.replicatedentity.ReplicatedRegister#value
   * @type {module:akkaserverless.Serializable}
   */
  Object.defineProperty(this, 'value', {
    get: function () {
      return currentValue;
    },
    set: function (value) {
      this.setWithClock(value);
    }.bind(this),
  });

  /**
   * Set the value using a custom clock.
   *
   * @function module:akkaserverless.replicatedentity.ReplicatedRegister#setWithClock
   * @param {module:akkaserverless.Serializable} value The value to set.
   * @param {module:akkaserverless.replicatedentity.Clock} [clock=Clocks.DEFAULT] The clock.
   * @param {number} [customClockValue=0] Ignored if a custom clock isn't specified.
   */
  this.setWithClock = function (
    value,
    clock = Clocks.DEFAULT,
    customClockValue = 0,
  ) {
    delta.value = AnySupport.serialize(value, true, true);
    if (clock !== undefined) {
      delta.clock = clock;
      delta.customClockValue = customClockValue;
    }
    currentValue = value;
    return this;
  };

  this.resetDelta = function () {
    delta = {
      value: null,
      clock: null,
      customClockValue: 0,
    };
  };

  this.getAndResetDelta = function () {
    if (delta.value !== null) {
      const toReturn = delta;
      this.resetDelta();
      return {
        register: toReturn,
      };
    } else {
      return null;
    }
  };

  this.applyDelta = function (delta, anySupport) {
    if (!delta.register) {
      throw new Error(
        util.format('Cannot apply delta %o to ReplicatedRegister', delta),
      );
    }
    this.resetDelta();
    currentValue = anySupport.deserialize(delta.register.value);
  };

  this.toString = function () {
    return 'ReplicatedRegister(' + currentValue + ')';
  };
}

module.exports = ReplicatedRegister;
