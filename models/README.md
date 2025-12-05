# Model & Training Results

This directory contains the source code for training, the final optimized weights, and comprehensive performance analysis charts.

## File Overview
* **`ENGG680_CSGuard_Group5.ipynb`**: The Notebook used for training on **Google Colab** (using Tesla T4 GPU). It covers data preprocessing, YOLOv8n training, hyperparameter tuning and validation.
* **`best.pt`**: The final trained model weights, optimized for edge deployment. This file is loaded by the backend application for real-time inference.
* **`confusion_matrix.png`**: Visual analysis of model performance across classes.
    * *Key Insight:* The model is highly accurate on standard PPE (Hardhats, Vests) but struggles slightly with "No-PPE" classes due to diverse negative features.
* **`results.png`**: Loss curves and mAP trends.
    * *Key Insight:* Shows healthy training with no overfitting; performance saturated around 70 epochs.
* **`val_batch_predictions.jpg`**: Side-by-side comparison of Ground Truth vs. Model Predictions on validation data.

## Model Specifications
* **Architecture:** YOLOv8 Nano (v8n)
* **Parameters:** 3.2 Million (Ultra-lightweight for low latency)
* **Input Resolution:** 640x640
* **Training Dataset:** [Roboflow Construction Site Safety](https://www.kaggle.com/datasets/snehilsanyal/construction-site-safety-image-dataset-roboflow) (>5,600 images)

## 📊 Performance Metrics
| Metric | Score | Note |
| :--- | :--- | :--- |
| **mAP@50** | **0.80** | High overall accuracy for safety monitoring. |
| **Box Precision** | **0.91** | Very low false alarm rate. |
| **Recall** | **0.71** | Good coverage, with room for improvement on "missed detections". |

---
*Model training and tuning performed by Hyde.*
