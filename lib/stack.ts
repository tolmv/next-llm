import { StackClientApp, StackServerApp } from "@stackframe/stack";

const stackUrls = {
  home: "/",
  signIn: "/handler/sign-in",
  afterSignIn: "/",
  signUp: "/handler/sign-up",
  afterSignUp: "/",
  afterSignOut: "/",
  accountSettings: "/handler/account-settings",
  handler: "/handler",
};

export const stackClientApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  urls: stackUrls,
});

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: stackUrls,
});
