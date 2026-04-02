import { type Href, Redirect } from "expo-router";

export default function NativeSsoCallbackRoute() {
  return <Redirect href={"/sign-in" as Href} />;
}
