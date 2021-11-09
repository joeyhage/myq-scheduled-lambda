import { myQApi } from "@hjdhjd/myq";

export const handler = async (): Promise<void> => {
  const myQ = new myQApi(process.env.USERNAME!, process.env.PASSWORD!);
  await myQ.refreshDevices();

  const oneHourAgo = new Date();
  oneHourAgo.setHours(new Date().getHours() - 1);
  await Promise.all(
    myQ.devices
      .filter((device) => device.device_family === "garagedoor")
      .filter((device) => {
        console.log(`Found garage door with name '${device.name}'`);
        return device.state.door_state.toLowerCase() === "open";
      })
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
