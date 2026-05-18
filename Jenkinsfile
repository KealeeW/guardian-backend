pipeline {
    agent any
    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        IMAGE_NAME = 'guardian-backend'
        IMAGE_TAG = "v1.0.${BUILD_NUMBER}"
        CONTAINER_NAME = 'guardian-staging'
        DOCKER_USER = 'kealeew'
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/KealeeW/guardian-backend.git'
            }
        }
        stage('Build') {
            steps {
                echo "Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}"
                sh 'npm install'
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }
        stage('Test') {
            steps {
                echo 'Running automated Mocha/Chai tests'
                sh '''
                    docker run --rm \
                        -e NODE_ENV=test \
                        -e JWT_SECRET=supersecretkey123 \
                        -e MONGODB_URI=mongodb://admin:password@host.docker.internal:27018/guardian_test?authSource=admin \
                        ${IMAGE_NAME}:${IMAGE_TAG} \
                        npm test
                '''
            }
        }
        stage('Code Quality') {
            steps {
                echo 'Running ESLint code quality analysis'
                sh 'npm install --save-dev eslint || true'
                sh 'npx eslint src/ --ext .js --env node --env es2021 --rule "no-unused-vars: warn" --rule "semi: warn" --format stylish || true'
            }
        }
        stage('Security') {
            steps {
                echo 'Running npm audit security scan'
                sh 'npm audit || true'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying to staging environment'
                sh 'docker stop ${CONTAINER_NAME} 2>/dev/null || true'
                sh 'docker rm ${CONTAINER_NAME} 2>/dev/null || true'
                sh '''
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p 3001:3000 \
                        -e NODE_ENV=staging \
                        -e JWT_SECRET=supersecretkey123 \
                        -e MONGODB_URI=mongodb://admin:password@host.docker.internal:27018/guardian?authSource=admin \
                        -e PORT=3000 \
                        ${IMAGE_NAME}:${IMAGE_TAG}
                '''
                sh 'sleep 10'
                sh 'docker ps | grep ${CONTAINER_NAME}'
                echo 'Application deployed to staging on port 3001'
            }
        }
        stage('Release') {
            steps {
                echo "Pushing ${IMAGE_NAME}:${IMAGE_TAG} to Docker Hub"
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKER_HUB_USER',
                    passwordVariable: 'DOCKER_HUB_PASS'
                )]) {
                    sh 'echo "$DOCKER_HUB_PASS" | docker login -u "$DOCKER_HUB_USER" --password-stdin'
                    sh 'docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}'
                    sh 'docker tag ${IMAGE_NAME}:latest ${DOCKER_USER}/${IMAGE_NAME}:latest'
                    sh 'docker push ${DOCKER_USER}/${IMAGE_NAME}:${IMAGE_TAG}'
                    sh 'docker push ${DOCKER_USER}/${IMAGE_NAME}:latest'
                    sh 'docker logout'
                }
                echo "Release ${IMAGE_NAME}:${IMAGE_TAG} pushed to Docker Hub successfully"
            }
        }
    }
    post {
        success {
            echo "Pipeline completed successfully - ${IMAGE_NAME}:${IMAGE_TAG} is live"
        }
        failure {
            echo "Pipeline failed - check logs above for details"
        }
    }
}
