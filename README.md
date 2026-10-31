# 🚀 TestPilot AI
### Automated Unit Test Generation and Coverage Analysis Engine

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Test Framework: Jest](https://img.shields.io/badge/Test%20Framework-Jest-red.svg)](https://jestjs.io/)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%20%2F%20GPT--4-orange.svg)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)

**TestPilot** is an intelligent automated unit testing platform designed for JavaScript and TypeScript codebases. It combines **Abstract Syntax Tree (AST)** static program analysis with modern **Large Language Models (Google Gemini & OpenAI GPT-4)** to synthesize production-ready Jest test suites, construct dependency mocks, execute tests in sandboxed environments, and iteratively improve code coverage.

---

## 🏛️ System Architecture

![System Architecture](./system_architecture.png)

TestPilot operates across four cohesive architectural tiers:
1. **VS Code Extension & Developer UI**: Contributes CodeLens overlays, editor context-menu triggers, an interactive test preview webview panel, and a live results sidebar.
2. **Static Program Analysis (AST Engine)**: Traverses codebases via `@babel/parser` to extract function signatures, parameters, control-flow branches, and intra-module call trees.
3. **AI Prompt Orchestration Core**: Translates AST code context into structured prompts enforcing happy paths, boundary conditions, edge cases (`null`/`undefined`, type coercion, async rejections), and mock templates.
4. **Execution, Sandboxing & Coverage Engine**: Spawns isolated Jest runners to execute generated test suites, instruments Istanbul/NYC metrics, and re-prompts the AI for uncovered code paths (`--expand-unit-tests`).

---

## ⚡ Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ recommended
- **Test Framework**: Jest

### 2. Installation
```bash
npm install
```

### 3. Configure AI API Key
TestPilot natively supports Google Gemini (Free Tier) and OpenAI:

```bash
# Using Google Gemini API (Recommended & Free):
node -e "const fs = require('fs'); if (!fs.existsSync('./.pythagora')) fs.mkdirSync('./.pythagora'); fs.writeFileSync('./.pythagora/config.json', JSON.stringify({ gemini_api_key: 'YOUR_GEMINI_KEY', model: 'gemini-2.5-flash' }, null, 2));"

# Or using OpenAI API:
npx pythagora --config --openai-api-key <YOUR_OPENAI_API_KEY>
```

---

## 💻 Usage & Workflows

### Option 1: VS Code Extension
TestPilot provides native IDE integration:
* Right-click on any exported function in the editor $\rightarrow$ **"TestPilot: Generate Unit Tests"**.
* Click the inline CodeLens banner: **`⚡ TestPilot: Generate Tests for <function>`**.
* View real-time test execution, stack traces, and coverage in the **TestPilot Activity Bar Sidebar**.
* Preview and selectively commit test suites in the **Interactive Test Preview Panel**.

### Option 2: Express REST API Backend
Start the standalone backend server:
```bash
npm run start:server
```
Available REST endpoints:
* `GET /health`: Health check and system uptime status.
* `POST /api/code/analyze`: Parses AST and returns function scopes and dependencies.
* `POST /api/test/generate`: Triggers test synthesis for a specified file/function.
* `POST /api/test/run`: Executes test suites in a sandbox and returns JSON execution metrics.

### Option 3: Terminal CLI Runner
* **For a single function:**
  ```bash
  node src/scripts/unit.js --func isObjectId --path ./src/utils/common.js
  ```
* **For an entire codebase:**
  ```bash
  node src/scripts/unit.js --path ./src
  ```
* **Run tests with Istanbul coverage:**
  ```bash
  npm test
  ```
* **Expand tests for missing branch coverage:**
  ```bash
  node src/scripts/unitExpand.js --path ./pythagora_tests/unit/src/utils/
  ```

---

## 🐳 Docker Deployment

Run the complete backend and testing environment in Docker:

```bash
# Build and run container:
docker-compose up --build -d

# Check service health:
curl http://localhost:3000/health
```

---

## 📁 Project Structure

```text
├── src/
│   ├── extension.js         # VS Code Extension entry point & command registry
│   ├── server.js            # Express-compatible REST API server
│   ├── ui/
│   │   ├── testPreviewPanel.js       # Webview panel for reviewing generated tests
│   │   └── resultsSidebarProvider.js # Sidebar TreeView for execution status
│   ├── helpers/
│   │   ├── geminiApi.js        # Google Gemini 2.5 Flash API client & fallbacks
│   │   ├── testPlanner.js      # Two-stage AI scenario deduction engine
│   │   ├── failureDiagnosis.js # AI-assisted stack trace & error diagnosis
│   │   ├── api.js              # Unified API routing and client configuration
│   │   └── unitTests.js        # Test generation orchestration pipeline
│   ├── scripts/             # Core CLI execution scripts (unit.js, unitExpand.js)
│   └── utils/
│       ├── logger.js        # Pino structured JSON logger
│       ├── code.js          # AST code traversal and syntax extraction
│       └── files.js         # File path and dependency resolution
├── pythagora_tests/         # Auto-generated Jest test suites and benchmarks
├── .github/workflows/ci.yml # GitHub Actions automated CI/CD pipeline
├── Dockerfile               # Containerized backend execution environment
├── docker-compose.yml       # Docker Compose multi-service specification
├── system_architecture.png  # System architecture diagram
├── package.json
└── README.md
```

---

## 🎓 Academic Capstone Project
* **Course:** CSL 801 - Project Phase III
* **Institution:** Indian Institute of Information Technology Una (IIIT Una)
* **Supervisor:** Dr. Mrityunjay Singh
* **Team & Workstream Ownership:**
  * **Vansh Verma (23165)**: *Backend & DevOps Lead* (Express REST API, Pino logging, AST dependencies, Docker & CI/CD)
  * **Vasu Goel (23166)**: *AI / ML Lead* (Gemini API integration, multi-model fallback, prompt engineering & test planning)
  * **Aditya Kumar Goyal (23105)**: *VS Code Extension & UI Lead* (Extension lifecycle, CodeLens triggers, webview preview & sidebar results)
