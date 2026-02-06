pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        PORT = '3002'
        // Load your paths from .env if you want, or Jenkins workspace default
        FILE_DESTINATION = "${WORKSPACE}/Govtproject/fileupload"
        NOTARY_LOG_FILE_PATH = "${WORKSPACE}/Generatedlicenses"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo 'Checking out source code...'
                git url: 'https://github.com/SantoshKumar9290/notaryBackend.git', branch: 'main'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm install'
            }
        }

        stage('Prepare Directories') {
            steps {
                echo 'Creating required directories for logs and file uploads...'
                sh '''
                    mkdir -p $FILE_DESTINATION
                    mkdir -p $NOTARY_LOG_FILE_PATH
                    echo "Directories created:"
                    echo "Logs: $NOTARY_LOG_FILE_PATH"
                    echo "File uploads: $FILE_DESTINATION"
                '''
            }
        }

        stage('Start Application') {
    steps {
        sh '''
          export $(cat .env | xargs)
          pm2 delete notary-backend || true
          pm2 start index.js --name notary-backend
          pm2 save
        '''
    }
}


    }

    post {
        success {
            echo 'Backend started successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
