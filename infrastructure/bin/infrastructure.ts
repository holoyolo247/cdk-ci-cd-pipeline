#!/usr/bin/env node
import 'source-map-support/register';
import {App} from 'aws-cdk-lib';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new App();

if(!process.env.DEPLOY_ENVIROMENT) throw new Error('Please supply the DEPLOY_ENVIROMENT environment variable')
const {DEPLOY_ENVIROMENT} = process.env
new InfrastructureStack(app, `${DEPLOY_ENVIROMENT}-InfrastructureStack`, {
  DEPLOY_ENVIROMENT,
  description: `Stack for the ${DEPLOY_ENVIROMENT} infrastructure deployed using the CDK`
});