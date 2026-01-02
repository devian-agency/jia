/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as conversations from "../conversations.js";
import type * as dailyCheckins from "../dailyCheckins.js";
import type * as jiaProfile from "../jiaProfile.js";
import type * as media from "../media.js";
import type * as memories from "../memories.js";
import type * as messages from "../messages.js";
import type * as mood from "../mood.js";
import type * as notifications from "../notifications.js";
import type * as specialEvents from "../specialEvents.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  conversations: typeof conversations;
  dailyCheckins: typeof dailyCheckins;
  jiaProfile: typeof jiaProfile;
  media: typeof media;
  memories: typeof memories;
  messages: typeof messages;
  mood: typeof mood;
  notifications: typeof notifications;
  specialEvents: typeof specialEvents;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
