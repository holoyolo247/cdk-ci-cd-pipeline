import { RemovalPolicy, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import {
 BuildSpec,
 Cache,
 LinuxBuildImage,
 LocalCacheMode,
 PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
 CodeBuildAction,
 GitHubSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
 CompositePrincipal,
 PolicyDocument,
 PolicyStatement,
 Role,
 ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';


interface PipelineStackProps extends StackProps {
 envName: string;
 infrastructureRepoName: string;
 infrastructureBranchName: string;
 repositoryOwner: string;
}


export class PipelineStack extends Stack {
 constructor(scope: Construct, id: string, props: PipelineStackProps) {
   super(scope, id, props);
   console.log(props);
   const {
     envName,
     infrastructureRepoName,
     infrastructureBranchName,
     repositoryOwner,
   } = props;


   const githubToken = SecretValue.secretsManager("github-token-company");


   const infrastructureDeplpyRole = new Role(
     this,
     "InfrastructureDeployRole",
     {
       assumedBy: new CompositePrincipal(
         new ServicePrincipal("codebuild.amazonaws.com"),
         new ServicePrincipal("codepipeline.amazonaws.com")
       ),
       inlinePolicies: {
         CdkDeployPermission: new PolicyDocument({
           statements: [
             new PolicyStatement({
               actions: ["sts:AssumeRole"],
               resources: ["arn:aws:iam::*:role/cdk-*"],
             }),
           ],
         }),
       },
     }
   );


   const artifactBucket = new Bucket(this, "ArtifactBucket", {
     bucketName: `${envName}-ci-cd-artifact-bucket-demo-hktiot`,
     removalPolicy: RemovalPolicy.DESTROY,
     autoDeleteObjects: true,
   });


   // THIS ARTIFACT goes to the bucket , and used by the codeipieline to refernce  later stages
   const infrastructureSourceOutput = new Artifact(
     "InfrastructureSourceOutput"
   );
   const infrastructureBuildOutput = new Artifact("InfrastructureBuildOutput");
   const infrastructureBuildProject = new PipelineProject(
     this,
     "InfrastructureBuildProject",
     {
       environment: {
         buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
       },
       environmentVariables: {
         DEPLOY_ENVIRONMENT: {
           value: envName, // this allow the dev key or the prod key to pass in this porject, and then use it later for cdk deploy resource and deploy to the correct enviroment
         },
       },
       buildSpec: BuildSpec.fromObject({
         //
         version: "0.2", // phase of build : in  phrases we can define different phases where different command we want to run in a speicfic order everytime our project is build
         phases: {
           install: {
             "runtime-versions": {
               nodejs: "20.x",
             },
             commands: [
               // define command in this phases
               "npm install -g aws-cdk",
               "cd infrastructure",
               "npm install",
             ],
           },
           build: {
             commands: ["echo Building phase...", "npm run test"],
           },
         },
         artifacts: {
        //  "base-directory": "infrastructure",
           files: "**/*",
         },
        //  cache: {
        //    paths: ["node_modules/**/*"],
        //  },
       }),
    //   cache: Cache.local(LocalCacheMode.CUSTOM),
     }
   );


   const infrastructureDeployProject = new PipelineProject(
     this,
     "InfrastructureDeployProject",
     {
       role: infrastructureDeplpyRole,
       environment: {
         buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
       },
       environmentVariables: {
         DEPLOY_ENVIRONMENT: {
           value: envName, // this allow the dev key or the prod key to pass in this porject, and then use it later for cdk deploy resource and deploy to the correct enviroment
         },
       },
       buildSpec: BuildSpec.fromObject({
         //
         version: "0.2", // phase of build : in  phrases we can define different phases where different command we want to run in a speicfic order everytime our project is build
         phases: {
           install: {
             "runtime-versions": {
               nodejs: "20.x",
             },
             commands: [
              "echo 'Listing files and directories in infrastructure folder:'",
              "ls -al", // List all files and directories in the current directory
               // define command in this phases
               "npm install -g aws-cdk",
                "cd infrastructure",
               "npm install",
             ],
           },

          
         
           build: {
             commands: [
              `cdk deploy --context env=${envName} --require-approval ${envName === "prod" ? "true" : "never"}`, 
             ],
           },
         },
       }),
     }
   );


   const pipeline = new Pipeline(this, "CIPipeline", {
     pipelineName: `${envName}-CI-Pipeline`,
     role: infrastructureDeplpyRole, // so that the pipeline and code build can deploy the cdk infra
     artifactBucket, // the pipelein knows to use this bucket to store artifact
   });


   pipeline.addStage({
     stageName: "Source",
     actions: [
       new GitHubSourceAction({
         owner: repositoryOwner,
         repo: infrastructureRepoName,
         actionName: "infrastructureSource",
         branch: infrastructureBranchName,
         output: infrastructureSourceOutput,
         oauthToken: githubToken,
       }),
     ],
   });


   pipeline.addStage({
     stageName: "Build",
     actions: [
       new CodeBuildAction({
         actionName: "BuildCdkInfrastructure",
         project: infrastructureBuildProject,
         input: infrastructureSourceOutput,
         outputs: [infrastructureBuildOutput],
         role: infrastructureDeplpyRole,
       }),
     ],
   });


   pipeline.addStage({
     stageName: "Deploy",
     actions: [
       new CodeBuildAction({
         actionName: "DeployCdkInfrastructure",
         project: infrastructureDeployProject,
         input: infrastructureBuildOutput,
         role: infrastructureDeplpyRole,
       }),
     ],
   });
 }
}


