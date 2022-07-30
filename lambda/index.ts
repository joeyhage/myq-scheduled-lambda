import { myQApi } from "@hjdhjd/myq";
import { SSM } from "aws-sdk";
import axios from "axios";

export const handler = async (): Promise<void> => {
  const { Parameter } = await new SSM({
    region: process.env.AWS_REGION || "us-east-1",
  })
    .getParameter({ Name: process.env.SECRET_NAME!, WithDecryption: true })
    .promise();
  const { username, password, webhookUrl } = JSON.parse(
    Parameter?.Value || "{}"
  );
  await handleMyQRequests(username, password, webhookUrl);
};

async function handleMyQRequests(
  username: string,
  password: string,
  webhookUrl: string,
  attempt = 1
): Promise<void> {
  try {
    const myQ = new myQApi(username, password);
    await myQ.refreshDevices();

    const thresholdTime = new Date();
    thresholdTime.setHours(
      new Date().getHours() - Number(process.env.OPEN_THRESHOLD_HRS)
    );

    await Promise.all(
      (myQ.devices || [])
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
        .map(async (device) => {
          console.log(`Closing ${device.name}`);
          return myQ.execute(device, "close").then(async (result) => {
            console.log(`${device.name} close command result: ${result}`);
            await sendNotification(
              webhookUrl,
              `${device.name} ${
                result ? "was closed" : "had an error closing"
              } at ${formatDate(new Date())}`
            );
          });
        })
    );
  } catch (e) {
    console.error("Uncaught exception", e);
    if (attempt < 2) {
      await handleMyQRequests(username, password, webhookUrl, attempt + 1);
    } else {
      await sendNotification(
        webhookUrl,
        `An error occurred with the my queue garage door closer at ${formatDate(
          new Date()
        )}`
      );
    }
  }
}

async function sendNotification(
  webhookUrl: string,
  message: string
): Promise<void> {
  await axios.get(`${webhookUrl}&notification=${encodeURIComponent(message)}`);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("default", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
    timeZone: process.env.TIMEZONE,
    timeZoneName: "short",
  }).format(date);
}
