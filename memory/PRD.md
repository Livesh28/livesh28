# XAI Pharma - Explainable AI-Based Multi-Disease and Drug Response Prediction System

## Original Problem Statement
Build a full-stack AI-powered healthcare web application that predicts multiple diseases using genomic data and recommends drug responses using deep learning and explainable AI.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Chart.js, Phosphor Icons
- **Backend**: FastAPI with MongoDB
- **Storage**: MongoDB + Emergent Object Storage for CSV files
- **AI/ML**: TensorFlow-ready simulated model (can be replaced with real trained model)

## User Personas
1. **Healthcare Researchers**: Analyze patient genomic data and disease risks
2. **Clinicians**: View patient predictions and drug recommendations
3. **Data Scientists**: Upload datasets and review SHAP explanations

## Core Requirements (Static)
- Multi-disease prediction (Cancer, Diabetes, Heart Disease, Alzheimer's, Hypertension)
- Drug response prediction (Effective/Not Recommended)
- SHAP-based explainable AI visualization
- CSV file upload for genomic data
- Patient management system
- Scheduling/calendar system
- Real-time analytics dashboard

## What's Been Implemented (March 22, 2026)

### Backend
- FastAPI server with 17+ API endpoints
- MongoDB integration for patients, predictions, files, schedule
- Object Storage integration for CSV file uploads
- Simulated ML model for multi-disease & drug response prediction
- SHAP value generation for explainability
- Personalized recommendation engine
- Sample data initialization endpoint

### Frontend
- Modern Swiss-inspired clinical dashboard UI
- Dashboard with stats, disease risk overview, charts (bar, line, trends)
- Patients page with CRUD operations, search, filtering
- Patient detail page with:
  - Disease Predictions tab with progress bars
  - Drug Response tab showing effectiveness
  - SHAP Analysis tab with gene contribution chart
  - Recommendations tab with personalized advice
- Reports page with aggregated analytics
- Upload page with drag-and-drop CSV support
- Schedule page with full calendar view
- Responsive sidebar navigation

### Charts & Visualizations
- Disease Risk Bar Charts (color-coded by severity)
- Trend Line Charts for predictions over time
- SHAP Waterfall/Bar Charts (blue=increases risk, red=decreases risk)
- Drug Effectiveness Stacked Bar Charts

## Prioritized Backlog

### P0 (Critical) - DONE
- ✅ Multi-disease prediction system
- ✅ Drug response prediction
- ✅ SHAP explanations
- ✅ Patient management
- ✅ File upload

### P1 (High Priority) - Future
- [ ] Real TensorFlow model training with actual genomic data
- [ ] User authentication system
- [ ] PDF report generation/export
- [ ] Email notifications for high-risk patients

### P2 (Medium Priority) - Future
- [ ] Real-time WebSocket updates
- [ ] Batch processing for large datasets
- [ ] Model retraining pipeline (continuous learning)
- [ ] Patient comparison view

### P3 (Nice to Have) - Future
- [ ] Mobile-responsive improvements
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] API rate limiting

## Next Tasks
1. Integrate real trained TensorFlow model with actual genomic dataset
2. Add user authentication (JWT or Google OAuth)
3. Implement PDF report export functionality
4. Add email notifications for high-risk alerts

## Technical Notes
- The ML model is currently simulated - can be replaced with real TensorFlow/PyTorch model
- Object storage requires EMERGENT_LLM_KEY for cloud storage (falls back to local)
- All API routes prefixed with /api for Kubernetes ingress routing
