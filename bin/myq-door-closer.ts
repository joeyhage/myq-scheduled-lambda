#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { MyqDoorCloserStack } from "../lib/myq-door-closer-stack";

const app = new cdk.App();
new MyqDoorCloserStack(app, "MyqDoorCloserStack");
