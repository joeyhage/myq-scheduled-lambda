import { myQApi } from "@hjdhjd/myq";
import { SSM } from "aws-sdk";

export const handler = async (): Promise<void> => {
  const { Parameter } = await new SSM({ region: process.env.AWS_REGION || 'us-east-1' })
    .getParameter({ Name: process.env.SECRET_NAME!, WithDecryption: true })
    .promise();
  const {username, password } = JSON.parse(Parameter?.Value || "{}");
  const myQ = new myQApi(username, password);
  await myQ.refreshDevices();

  const thresholdTime = new Date();
  thresholdTime.setHours(new Date().getHours() - Number(process.env.OPEN_THRESHOLD_HRS));
  
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
        return new Date(device.state.last_update) < thresholdTime;
      })
      .map((device) =>
        myQ.execute(device, "close").then((result) => {
          console.log(`${device.name} close command result: ${result}`);
        })
      )
  );
};
