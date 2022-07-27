# MyWebhook

My Webhook

## cURL + Google Chat

```bash
curl -H "Content-Type: application/json" -X POST -d "{\"text\":\"Hello World\"}" -s "https://chat.googleapis.com/v1/spaces/AAAAjlROM8c/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=..."
```

## cURL + Slack

## GitHub + OpenShift

<https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks>

GitHub repo -> Settings -> Webhooks

Payload URL

Content type (application/json)

SSL verification

Which events would you like to trigger this webhook?

Active

![1658939691996](image/README/github_webhook.png)

![1658939825073](image/README/openshift_pipeline_github_webhooks.png)

"Copy URL with Secret" - use this as the "Payload URL"

```yaml
kind: BuildConfig
apiVersion: build.openshift.io/v1
metadata:
  name: my-app-pipeline
  namespace: my-preproduction
  uid: 03b76f01-a7d8-4ffa-8ebc-639af2b566f1
  resourceVersion: '402209951'
  generation: 759
  creationTimestamp: '2022-04-13T17:56:41Z'
  labels:
    app: my-app
  annotations:
    kubectl.kubernetes.io/last-applied-configuration: >
      {"apiVersion":"build.openshift.io/v1","kind":"BuildConfig","metadata":{"annotations":{},"labels":{"app":"my-app"},"name":"my-app-pipeline","namespace":"my-preproduction"},"spec":{"failedBuildsHistoryLimit":3,"runPolicy":"SerialLatestOnly","source":{"git":{"ref":"master","uri":"git@github.com:xxx/my-app.git"},"sourceSecret":{"name":"github-secret"},"type":"Git"},"strategy":{"jenkinsPipelineStrategy":{"jenkinsfilePath":"openshift4/Jenkinsfile"},"type":"JenkinsPipeline"},"successfulBuildsHistoryLimit":3,"triggers":[{"github":{"secret":"tsask"},"type":"GitHub"}]}}
spec:
  nodeSelector: null
  output: {}
  resources: {}
  successfulBuildsHistoryLimit: 3
  failedBuildsHistoryLimit: 3
  strategy:
    type: JenkinsPipeline
    jenkinsPipelineStrategy:
      jenkinsfilePath: openshift4/Jenkinsfile
  postCommit: {}
  source:
    type: Git
    git:
      uri: 'git@github.com:telus/my-app.git'
      ref: master
    sourceSecret:
      name: github-secret
  triggers:
    - type: GitHub
      github:
        secret: tsask
  runPolicy: SerialLatestOnly
status:
  lastVersion: 725
```

JenskinsFile

```jenkins
String appName
String buildVersion
String gitCommitId
String gitCommitMsg
String templateDir

pipeline {
  agent any

  options {
    ansiColor('xterm')
    skipDefaultCheckout()
    timeout(90)
  }

  stages {
    stage('Checkout') {
      steps {
        script {
          sh "oc project ${env.PROJECT_NAME}"

          checkout([
           $class: 'GitSCM',
           branches: scm.branches,
           doGenerateSubmoduleConfigurations: scm.doGenerateSubmoduleConfigurations,
           extensions: scm.extensions + [[$class: 'CloneOption', noTags: true, reference: '', shallow: true]],
           submoduleCfg: [],
           userRemoteConfigs: scm.userRemoteConfigs
          ])

          appName = env.JOB_BASE_NAME.split("${env.PROJECT_NAME}-")[1].split("-pipeline")[0]

          String gitShortId = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          String currentDate = sh(returnStdout: true, script: 'date +%s').trim()
          buildVersion = currentDate + '-' + gitShortId

          gitCommitId = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
          gitCommitMsg = sh(returnStdout: true, script: 'git log --format=%B -n 1 HEAD').trim()
        }
      }
    }

    stage('Apply Templates') {
      steps {
        script {
          if (fileExists('.platform/openshift4/openshift-template.yml')) {
            templateDir = '.platform/openshift4'
          } else if (fileExists('openshift4/openshift-template.yml')) {
            templateDir = 'openshift4'
          } else {
            errorMessage = "🚨 ERROR: openshift-template.yml not found 🚨"
            currentBuild.result = "FAILURE"
            throw new Exception(errorMessage)
          }
          sh "oc apply -f ${templateDir}/openshift-template.yml"
          sh "oc process ${appName}-pipeline | oc apply -f -"
        }
      }
    }

    stage('Build') {
      steps {
        script {
          sh("""
            if oc get istag ${appName}:${buildVersion} > /dev/null 2>&1
            then
              echo "Image tag ${appName}:${buildVersion} exists... skipping build"
              exit 0
            fi

            oc start-build ${appName} --follow --commit=${gitCommitId} --wait=true

            oc tag ${appName}:latest ${appName}:${buildVersion}
          """)
        }
      }
    }
    // Temporarily disabled for release
    stage('Test') {
      options {
        timeout(45)
      }
      steps {
        script {
          sh("${templateDir}/run-test.sh ${appName} ${buildVersion}")
        }
      }
    }

    stage('Deploy Canary') {
      steps {
        script {
          deploy(
            appName: appName,
            buildVersion: buildVersion,
            environment: 'canary',
            numReplicas: 1,
            templateDir: templateDir
          )
        }
      }
    }

    stage('Deploy QA') {
      steps {
        script {
          deploy(
            appName: appName,
            buildVersion: buildVersion,
            environment: 'qa',
            numReplicas: 1,
            templateDir: templateDir
          )
        }
      }
    }
  }

  post {
    always {
      echo 'Clean up workspace'
      deleteDir()
    }
    success {
      notifyBuild(
        message: 'Build succeeded',
        color: '#00FF00',
        emoji: 'panda_dance',
        buildVersion: buildVersion,
        gitCommitMsg: gitCommitMsg
      )
    }
    failure {
      notifyBuild(
        message:  'Build failed',
        color: '#FF0000',
        emoji: 'sadpanda',
        buildVersion: buildVersion,
        gitCommitMsg: gitCommitMsg
      )
    }
  }
}

def deploy(Map attrs) {
  String proxyIPs = sh(
    script: "oc get secret proxy-ips-${attrs.environment} -o jsonpath=\'{.data}\'| jq -r .ips | base64 --decode",
    returnStdout: true
  )

  println "proxyIPs: ${proxyIPs}"

  sh("""
    ${attrs.templateDir}/run-deploy.sh ${attrs.appName} ${attrs.environment} ${attrs.buildVersion} ${attrs.numReplicas} \"${proxyIPs}\"
    ${attrs.templateDir}/run-newrelic-notify.sh ${attrs.appName} ${attrs.environment} ${attrs.buildVersion}
  """)
}

// def loadTest(Map attrs) {
//   node {
//     unstash 'scripts'
//     ansiColor('xterm') {
//       sh("${attrs.templateDir}/run-load-test.sh ${attrs.environment} ${attrs.buildVersion}")
//     }
//   }
// }

def notifyBuild(Map attrs) {
  node {
    String route = sh(returnStdout: true, script: 'oc get route jenkins -o=\'jsonpath={.spec.host}\'').trim()
    String url = "https://${route}/job/${env.JOB_NAME}/${env.BUILD_NUMBER}/console"

    slackSend(
      color: attrs.color,
      message: "Openshift v4\n_${env.JOB_BASE_NAME}_ <${url}|${attrs.buildVersion}>\n*${attrs.message}* :${attrs.emoji}:\n```${attrs.gitCommitMsg}```",
      teamDomain: 'telusdigital',
      channel: 'casa-ci',
      token: env.SLACK_TOKEN
    )
  }
}
```
