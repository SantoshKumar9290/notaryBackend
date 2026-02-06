pipeline {
    agent any

    tools {
        nodejs 'Node16'  // Make sure Node16 is installed on Jenkins
    }

    environment {
        PORT = '3002'
        HOST = '0.0.0.0'
        APP_NAME = 'notary-be'
        APP_DIR = '/var/lib/jenkins/.jenkins/workspace/Notary-BACKEND'
        PM2_HOME = '/var/lib/jenkins/.pm2'
    }

    stages {

        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh "cd ${APP_DIR} && npm install"
            }
        }

        stage('Prepare Directories') {
            steps {
                sh """
                    mkdir -p ${APP_DIR}/Govtproject/fileupload
                    mkdir -p ${APP_DIR}/Govtproject/Generatedlicenses
                    chown -R jenkins:jenkins ${APP_DIR}/Govtproject
                """
            }
        }

        stage('Start Backend with PM2') {
            steps {
                sh """
                    export PM2_HOME=${PM2_HOME}

                    # Stop old process if exists
                    pm2 delete ${APP_NAME} || true

                    # Start backend with npm start
                    pm2 start "npm start" \
                        --name ${APP_NAME} \
                        --cwd ${APP_DIR}

                    # Save PM2 process list
                    pm2 save
                    pm2 status
                """
            }
        }
    }

    post {
        success {
            echo "Backend started successfully via PM2"
        }
        failure {
            echo "Pipeline failed! Check PM2 logs for details."
        }
    }
}
