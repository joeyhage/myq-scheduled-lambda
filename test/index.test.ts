import { handler } from "../lambda/index";

test("run lambda", async () => {
  await handler();
});
