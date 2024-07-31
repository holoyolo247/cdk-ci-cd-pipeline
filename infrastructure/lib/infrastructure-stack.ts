import {Stack,StackProps} from 'aws-cdk-lib';
import { LambdaIntegration, LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface InfrastructureStackProps extends StackProps {
  DEPLOY_ENVIROMENT :string
}

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);
    const {DEPLOY_ENVIROMENT} = props
    console.log(`${DEPLOY_ENVIROMENT} enviroment deteced`)


    const nodejsFunction = new NodejsFunction(this, "NodeJsFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: 'lib/lambdas/nodeLambdaFunction.ts',
      handler: 'handler',
      memorySize:128,
    });

    const apigateway = new LambdaRestApi(this, 'LambdaRestApi', {
      handler: nodejsFunction,
      proxy: false,
      restApiName: `${DEPLOY_ENVIROMENT} Rest API`
    });

    // hook lambda dunction to the actual method 
    const sayHello = apigateway.root.addResource('say-hello')
    sayHello.addMethod('GET', new LambdaIntegration(nodejsFunction))
}}
