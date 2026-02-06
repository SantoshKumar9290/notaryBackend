pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        PORT = '3002'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git(
                    url: 'https://github.com/SantoshKumar9290/notaryBackend.git',
                    branch: 'main'
                )
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Prepare Directories') {
            steps {
                sh '''
                    mkdir -p Govtproject/fileupload
                    mkdir -p Govtproject/Generatedlicenses
                    chown -R jenkins:jenkins Govtproject
                '''
            }
        }

        stage('Start Application') {
            steps {
                sh '''
                    # Load .env file for PM2
                    export $(cat .env | xargs)

                    # Stop old PM2 process if exists
                    pm2 delete notary-backend || true

                    # Start backend with environment variables
                    pm2 start index.js --name notary-backend --env production

                    pm2 save
                '''
            }
        }
    }

    post {
        success {
            echo 'Backend started successfully via PM2'
        }
        failure {
            echo 'Pipeline failed'
        }
    }
}
