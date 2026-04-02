import { Redirect, type Href } from "expo-router";

export default function NativeSsoCallbackRoute() {
  return <Redirect href={"/sign-in" as Href} />;
}
