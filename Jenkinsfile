pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Clone your GitHub repo automatically (Jenkins handles this)
                checkout scm
            }
        }
        stage('Install Dependencies') {
            steps {
                echo 'Running npm install...'
                sh 'npm install'
            }
        }
        stage('Start Application') {
            steps {
                echo 'Starting application with npm start...'
                sh 'npm start'
            }
        }
    }

    post {
        failure {
            echo 'Build failed!'
        }
        success {
            echo 'Build succeeded!'
        }
    }
}
