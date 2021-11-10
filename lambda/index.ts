import { myQApi } from "@hjdhjd/myq";
import { SecretsManager } from "aws-sdk";

export const handler = async (): Promise<void> => {
  const { SecretString } = await new SecretsManager({ region: "us-east-1" })
    .getSecretValue({ SecretId: "live/myq-door-closer/myq" })
    .promise();
  const { username, password } = JSON.parse(SecretString!);
  const myQ = new myQApi(username, password);
  await myQ.refreshDevices();

  const oneHourAgo = new Date();
  oneHourAgo.setHours(new Date().getHours() - 1);
  await Promise.all(
    myQ.devices
      .filter((device) => device.device_family === "garagedoor")
      .filter((device) => device.state.door_state.toLowerCase() === "open")
      .filter((device) => {
        console.log(
          `${device.name} has been open since ${new Date(
            device.state.last_update
          ).toLocaleTimeString()}`
        );
        return new Date(device.state.last_update) < oneHourAgo;
      })
      .map((device) =>
        myQ.execute(device, "close").then((result) => {
          console.log(`${device.name} close command result: ${result}`);
        })
      )
  );
};
