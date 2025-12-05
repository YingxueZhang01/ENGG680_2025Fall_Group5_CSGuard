# ENGG680_2025Fall_Group5_CSGuard
Vision-Based Real-Time Safety Gear Monitoring and Alert System for Construction Sites (Group 5). [NOTE: This repository serves as the final archive. All code and models were developed in Google Colab/Drive and migrated here for submission.]

Vision-Based Real-Time Safety Gear Monitoring and Alert System for Construction Sites
**Presented by Group 5:**
* Yingxue Zhang (Hyde)
* Jingfeng Sun 
*
*

## Development Timeline & Migration Note
This repository contains the **final artifacts** of our project. The active development and training processes were conducted entirely within **Google Colab** and **Google Drive** due to the need for GPU resources (Tesla T4). 

As a result, the commit history in this repository reflects the **migration date** rather than the actual development timeline. The source code, trained weights (`best.pt`), and logs were exported from our Colab environment and uploaded here for submission and archiving purposes.

## Project Overview
This project implements an edge-optimized YOLOv8 object detection model designed to monitor Personal Protective Equipment (PPE) compliance on construction sites in real-time.

### Key Features
* **Model:** YOLOv8 Nano (optimized for edge devices).
* **Dataset:** Roboflow Construction Site Safety (>5,600 images).
* **Performance:** Achieved mAP@50 of 0.801.
* **Software:** Python backend with a custom-designed frontend interface.

## Repository Structure
* `/models`: Contains the trained `best.pt` weights, the original Google Colab `.ipynb` source code and all results .
* `/docs`: Presentation PPT and Speech scripts.
* `/src`: Application source code (Backend logic & Frontend assets).
