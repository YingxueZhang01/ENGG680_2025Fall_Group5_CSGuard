# CSGuard Application Source Code

This directory contains the source code for the **Desktop Application** used to deploy the safety monitoring model. 

**Note:** To reduce repository size, `node_modules`, `dist`, and `release` folders are excluded. Please run `npm install` if you wish to build the project locally.

## Tech Stack (Full-Stack Implementation)
This application was architected and developed by Hyde using a hybrid approach:

* **Frontend:** 
    * **Framework:** React + TypeScript + Vite
    * **UI Design:** Gemini App Design (Custom Dashboard & Live Monitor UI)
    * **Features:** Real-time video canvas, Data visualization charts, Audit log tables.
* **Backend (Inference Engine):**
    * **Runtime:** Python (integrated via Electron IPC)
    * **CV Library:** Ultralytics YOLO (running local `best.pt`)
    * **Logic:** Frame-by-frame processing, Bounding box drawing, Violation logic triggering.
* **Wrapper:** 
    * **Electron:** Cross-platform desktop encapsulation.

## Key Directory Structure
* **`backend/`**: Contains the Python scripts that load the YOLO model and process video feeds. **No external APIs are used; inference runs locally.**
* **`electron/`**: Main process code handling window management and IPC communication.
* **`components/`**: React functional components for the Dashboard and Settings.
* **`services/`**: Logic for handling alert signals and data storage.

##  How to Run (Dev Mode)

1. **Install Dependencies:**
   ```bash
   npm install
   pip install ultralytics opencv-python
   npm run dev

## Software Features
* **Live Monitor**: Real-time inference with colored bounding boxes.
* **Dashboard**: Statistical breakdown of daily/weekly compliance rates.
* **Violation Logs**: searchable history of detected safety breaches with timestamps.
