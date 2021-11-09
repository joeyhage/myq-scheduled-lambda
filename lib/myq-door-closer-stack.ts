import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import { Runtime } from "@aws-cdk/aws-lambda";
import * as lambda from "@aws-cdk/aws-lambda-nodejs";
import { SourceMapMode } from "@aws-cdk/aws-lambda-nodejs";
import * as cdk from "@aws-cdk/core";
import * as path from "path";

export class MyqDoorCloserStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fn = new lambda.NodejsFunction(this, "MyQCloserLambda", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.resolve(__dirname, "../lambda/index.ts"),
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: SourceMapMode.INLINE,
        target: "es2018",
        externalModules: ["aws-sdk"],
      },
      environment: {
        USERNAME: process.env.MYQ_USERNAME!,
        PASSWORD: process.env.MYQ_PASSWORD!,
      }
    });

    const eventRule = new events.Rule(this, "LambdaScheduleRule", {
      ruleName: "myq-check-hourly",
      schedule: events.Schedule.cron({ minute: "5" }),
      targets: [new targets.LambdaFunction(fn)],
    });

    targets.addLambdaPermission(eventRule, fn);
  }
}
