# 🚀 Nexus Digital Signage System
**Enterprise-Grade Real-Time Signage Orchestration**

Nexus is a production-ready, distributed digital signage system designed for high-availability content delivery across large screen fleets. It combines a robust Node.js backend with a high-performance React frontend, packaged into a single-binary desktop launcher for seamless client distribution.

---

## 🌟 Key Features
*   **Real-Time Synchronization:** Socket.IO with Redis adapter for instant content updates.
*   **Autonomous Launcher:** Self-healing bootstrap sequence that manages MongoDB and service lifecycles.
*   **Enterprise Security:** Role-Based Access Control (RBAC), signed JWTs, and advanced threat detection.
*   **Professional Installer:** Bundled with Inno Setup for a standard Windows installation experience.
*   **SRE Optimized:** Comprehensive monitoring, heartbeat protocols, and self-improving reliability.
*   **QA Intelligence:** Integrated multi-agent testing system (MATS) for continuous validation.

---

## 🏗️ System Architecture
The system is built on a "Defense in Depth" architectural pattern:
1.  **Orchestrator (`launcher.js`):** Manages process health and dependency validation.
2.  **Core Engine (Node.js/Express):** Handles REST APIs and real-time broadcasting.
3.  **Client UI (React):** A high-fidelity administrative dashboard and specialized display player.
4.  **Data Layer (MongoDB/Redis):** High-concurrency state management and persistent storage.

---

## 🚀 Quick Start (For Developers)

### 1. Installation
```bash
npm run install:all
```

### 2. Development Mode
```bash
npm run dev
```

### 3. Build Production Executable
```bash
# Build for all platforms
npm run package:exe

# Build specific Windows binary for installer
npm run package:win
```

---

## 🛠 Project Structure
*   `launcher.js`: System entry point and service orchestrator.
*   `server/`: Backend engine and API services.
*   `client/`: React source and frontend assets.
*   `qa-intelligence-system/`: Autonomous multi-agent QA framework.
*   `dist/`: Compiled binaries and production builds.
*   `SRE.md`: Detailed reliability and operations documentation.
*   `installer_config.iss`: Windows installer configuration.

---

## 🛡 Security & Reliability
Nexus is built for 24/7 operations. For detailed information on failure modes, SLOs, and incident response, please refer to the [SRE Documentation](./SRE.md).

---

## 📜 License
Internal Production Release - Nexus Engineering Team © 2026
