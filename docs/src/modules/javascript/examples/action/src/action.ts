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

import { Action, replies } from "@lightbend/akkaserverless-javascript-sdk";
import * as proto from "../lib/generated/proto";

type Request = proto.akkaserverless.tck.model.action.Request;
type ProcessGroup = proto.akkaserverless.tck.model.action.ProcessGroup;

const { Response, ProcessGroup } = proto.akkaserverless.tck.model.action;

export const tckModel: Action = new Action(
    "proto/action.proto",
    "akkaserverless.tck.model.action.ActionTckModel"
).setCommandHandlers({
  ProcessUnary: processUnary,
  ProcessStreamedIn: processStreamedIn,
  ProcessStreamedOut: processStreamedOut,
  ProcessStreamed: processStreamed
});

function processUnary(request: Request): replies.Reply {
  return createReplyForGroup(ProcessGroup.create(request.groups[0]));
}

function processStreamedIn(context: Action.StreamedInContext) {
  let reply = replies.noReply();
  context.on("data", request => {
    const replyForThisRequest = createReplyForGroup(request.groups[0]);
    if (!replyForThisRequest.isEmpty()) {
      // keep the last type of reply but pass along the effects
      if (reply.getEffects())
        replyForThisRequest.addEffects(reply.getEffects());
      reply = replyForThisRequest;
    } else if (replyForThisRequest.getEffects()) {
      // pass along the effects from empty reply, but keep the previous non-empty reply
      reply.addEffects(replyForThisRequest.getEffects());
    }
  });
  // last callback return value is sent back for stream in, if it is a Reply
  context.on("end", () => reply);
}

function processStreamedOut(
    request: Request,
    context: Action.StreamedOutContext
) {
  createReplies(request).forEach(reply => {
    // imperative send of Reply (since we could have 1:* for the incoming, and they can happen async?)
    context.reply(reply);
  });
  context.end();
}

function processStreamed(context: Action.StreamedCommandContext) {
  context.on("data", request => {
    createReplies(request).forEach(reply =>
        // imperative send of Reply (since we could have 1:* for the incoming, and they can happen async?)
        context.reply(reply)
    );
  });
  context.on("end", () => context.end());
}

function createReplies(request: Request): replies.Reply[] {
  return request.groups.map(group =>
      createReplyForGroup(ProcessGroup.create(group))
  );
}

function createReplyForGroup(group: ProcessGroup): replies.Reply {
  let reply = replies.noReply();
  group.steps?.forEach(step => {
    if (step.reply) {
      reply = replies.message(Response.create({ message: step.reply.message }));
    } else if (step.forward) {
      reply = replies.forward(two.service.methods.Call, {
        id: step.forward.id
      });
    } else if (step.effect) {
      reply.addEffect(
          two.service.methods.Call,
          { id: step.effect.id },
          step.effect.synchronous || false
      );
    } else if (step.fail) {
      reply = replies.failure(step.fail.message || "");
    }
  });
  return reply;
}

export const two: Action = new Action(
    "proto/action.proto",
    "akkaserverless.tck.model.action.ActionTwo"
).setCommandHandlers({
  Call: () => Response.create()
});
