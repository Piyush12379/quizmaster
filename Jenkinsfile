pipeline {
    agent any

    environment {
        COMPOSE_FILE      = 'docker-compose.yml'
        APP_NAME          = 'QuizMaster'
        DOCKER_COMPOSE_CMD = 'docker compose'   // Docker v2; use 'docker-compose' for v1
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {

        stage('🔍 Checkout') {
            steps {
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "  ${APP_NAME} — Pulling latest source code"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                checkout scm
            }
        }

        stage('🧹 Teardown Old Containers') {
            steps {
                echo "Stopping and removing old containers, orphans & volumes…"
                sh """
                    ${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} down \
                        --remove-orphans \
                        --volumes \
                        || true
                """
            }
        }

        stage('🐳 Build Custom Docker Images') {
            parallel {
                stage('Build quiz-api') {
                    steps {
                        echo "Building backend image: quiz-api:latest"
                        sh "${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} build --no-cache quiz-api"
                    }
                }
                stage('Build quiz-ui') {
                    steps {
                        echo "Building frontend image: quiz-ui:latest"
                        sh "${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} build --no-cache quiz-ui"
                    }
                }
            }
        }

        stage('📦 Pull Hub Images') {
            steps {
                echo "Pulling mongo:7.0 and mongo-express:1.0.2 from Docker Hub…"
                sh """
                    docker pull mongo:7.0
                    docker pull mongo-express:1.0.2
                """
            }
        }

        stage('🚀 Deploy via Docker Compose') {
            steps {
                echo "Launching all 4 microservices in detached mode…"
                sh "${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} up -d"
            }
        }

        stage('✅ Health Check') {
            steps {
                echo "Waiting for services to stabilise…"
                sleep(time: 15, unit: 'SECONDS')
                sh """
                    echo "--- Running Containers ---"
                    docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

                    echo ""
                    echo "--- API Health ---"
                    curl -f http://localhost:5000/api/health || \
                        (echo "API health check FAILED" && exit 1)
                """
            }
        }
    }

    post {
        success {
            echo """
╔══════════════════════════════════════════╗
║  ✅  ${APP_NAME} deployed successfully!  ║
║                                          ║
║  Frontend  → http://localhost:3000       ║
║  API       → http://localhost:5000       ║
║  DB Admin  → http://localhost:8081       ║
╚══════════════════════════════════════════╝
            """
        }
        failure {
            echo "❌ Pipeline FAILED — rolling back containers…"
            sh "${DOCKER_COMPOSE_CMD} -f ${COMPOSE_FILE} down --remove-orphans || true"
        }
        always {
            echo "Pipeline finished. Check logs with: docker compose logs -f"
        }
    }
}
