//import { v4 as uuidv4 } from 'uuid';

 async function handler(event: any, context:any) {
//   console.log("request:", JSON.stringify(event));
//   console.log("Generating uuid: ", uuidv4());
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "Hello, CDK!"
  };
};

export {handler}