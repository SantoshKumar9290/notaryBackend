pipeline {
    agent any

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
                    mkdir -p Govtproject/Generatedlicenses/logs
                '''
            }
        }

        stage('Start Application') {
            steps {
                sh '''
                    pm2 delete notary-backend || true
                    pm2 start index.js --name notary-backend
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
