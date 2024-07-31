//import { v4 as uuidv4 } from 'uuid';

 async function handler(event: any, context:any) {
//   console.log("request:", JSON.stringify(event));
//   console.log("Generating uuid: ", uuidv4());
// i want to know the reuqest method and the route to the different 
// handler
console.log(event.httpMethod, event.path)

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: "Hello,  cdk is fun!"
  };
};

export {handler}