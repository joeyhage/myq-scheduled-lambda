import * as cdk from "aws-cdk-lib";
import { Duration } from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import * as path from "path";

export class MyqDoorCloserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secretName = "/live/myq-door-closer/myq";

    const fn = new lambda.NodejsFunction(this, "MyQCloserLambda", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.resolve(__dirname, "../lambda/index.ts"),
      bundling: {
        minify: true,
        sourceMap: true,
        sourceMapMode: lambda.SourceMapMode.INLINE,
        target: "ES2022",
        externalModules: ["aws-sdk"],
      },
      environment: {
        OPEN_THRESHOLD_HRS: "1",
        SECRET_NAME: secretName,
        TIMEZONE: "America/Chicago", // IANA Timezone name
      },
      timeout: Duration.seconds(15),
    });

    const parameter = ssm.StringParameter.fromSecureStringParameterAttributes(
      this,
      "MyQLogin",
      { parameterName: secretName, version: 1 }
    );
    parameter.grantRead(fn.role as iam.IGrantable);

    const eventRule = new events.Rule(this, "LambdaScheduleRule", {
      ruleName: "myq-check-hourly",
      schedule: events.Schedule.cron({ minute: "5" }),
      targets: [new targets.LambdaFunction(fn)],
    });

    targets.addLambdaPermission(eventRule, fn);
  }
}
