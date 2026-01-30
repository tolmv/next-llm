import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/lib/stack";

export default function HandlerPage(props: {
  params: Record<string, string[]>;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
