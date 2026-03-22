import requests
import sys
import json
from datetime import datetime

class XAIPharmaAPITester:
    def __init__(self, base_url="https://xai-pharma.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.patient_id = None
        self.prediction_id = None
        self.file_id = None
        self.event_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'} if not files else {}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.text[:200]}")
                except:
                    pass

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            required_fields = ['total_patients', 'total_predictions', 'total_files', 'average_risks']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field: {field}")
                    return False
            print(f"   Stats: {response['total_patients']} patients, {response['total_predictions']} predictions")
        return success

    def test_init_sample_data(self):
        """Initialize sample data"""
        success, response = self.run_test(
            "Initialize Sample Data",
            "POST",
            "init-sample-data",
            200
        )
        return success

    def test_get_patients(self):
        """Test get all patients"""
        success, response = self.run_test(
            "Get All Patients",
            "GET",
            "patients",
            200
        )
        if success and response:
            print(f"   Found {len(response)} patients")
            if len(response) > 0:
                self.patient_id = response[0]['id']
                print(f"   Using patient ID: {self.patient_id}")
        return success

    def test_create_patient(self):
        """Test creating a new patient"""
        patient_data = {
            "name": f"Test Patient {datetime.now().strftime('%H%M%S')}",
            "age": 35,
            "gender": "Female",
            "email": "test@example.com",
            "phone": "555-0123"
        }
        success, response = self.run_test(
            "Create Patient",
            "POST",
            "patients",
            200,
            data=patient_data
        )
        if success and response:
            self.patient_id = response['id']
            print(f"   Created patient ID: {self.patient_id}")
        return success

    def test_get_patient_detail(self):
        """Test get patient by ID"""
        if not self.patient_id:
            print("❌ No patient ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Patient Detail",
            "GET",
            f"patients/{self.patient_id}",
            200
        )
        if success:
            print(f"   Patient: {response.get('name', 'Unknown')}")
        return success

    def test_run_prediction(self):
        """Test running a prediction"""
        if not self.patient_id:
            print("❌ No patient ID available for prediction")
            return False

        # Generate sample gene data
        gene_data = {f"GENE_{i}": round(0.1 + (i * 0.01), 3) for i in range(1, 51)}
        
        prediction_data = {
            "patient_id": self.patient_id,
            "gene_data": gene_data
        }
        
        success, response = self.run_test(
            "Run Prediction",
            "POST",
            "predict",
            200,
            data=prediction_data
        )
        if success and response:
            self.prediction_id = response['id']
            print(f"   Prediction ID: {self.prediction_id}")
            print(f"   Disease predictions: {len(response.get('disease_predictions', {}))}")
            print(f"   Drug responses: {len(response.get('drug_responses', {}))}")
        return success

    def test_get_predictions(self):
        """Test get all predictions"""
        success, response = self.run_test(
            "Get All Predictions",
            "GET",
            "predictions",
            200
        )
        if success:
            print(f"   Found {len(response)} predictions")
        return success

    def test_get_prediction_detail(self):
        """Test get prediction by ID"""
        if not self.prediction_id:
            print("❌ No prediction ID available for testing")
            return False
        
        success, response = self.run_test(
            "Get Prediction Detail",
            "GET",
            f"predictions/{self.prediction_id}",
            200
        )
        return success

    def test_file_upload(self):
        """Test CSV file upload"""
        # Create a sample CSV content
        csv_content = """age,gender,GENE_1,GENE_2,GENE_3,GENE_4,GENE_5,label
35,Female,0.5,0.3,0.7,0.2,0.8,0
42,Male,0.6,0.4,0.5,0.9,0.3,1"""
        
        files = {'file': ('test_data.csv', csv_content, 'text/csv')}
        
        success, response = self.run_test(
            "Upload CSV File",
            "POST",
            "upload",
            200,
            files=files
        )
        if success and response:
            self.file_id = response['id']
            print(f"   File ID: {self.file_id}")
            print(f"   Rows: {response.get('rows', 0)}")
        return success

    def test_get_files(self):
        """Test get uploaded files"""
        success, response = self.run_test(
            "Get Uploaded Files",
            "GET",
            "files",
            200
        )
        if success:
            print(f"   Found {len(response)} files")
        return success

    def test_process_file(self):
        """Test processing uploaded file"""
        if not self.file_id or not self.patient_id:
            print("❌ Missing file ID or patient ID for processing")
            return False
        
        success, response = self.run_test(
            "Process CSV File",
            "POST",
            f"files/{self.file_id}/process?patient_id={self.patient_id}",
            200
        )
        return success

    def test_create_schedule_event(self):
        """Test creating a schedule event"""
        event_data = {
            "title": f"Test Event {datetime.now().strftime('%H%M%S')}",
            "patient_name": "Test Patient",
            "date": "2024-12-25",
            "time": "10:00",
            "type": "consultation",
            "notes": "Test event notes"
        }
        
        success, response = self.run_test(
            "Create Schedule Event",
            "POST",
            "schedule",
            200,
            data=event_data
        )
        if success and response:
            self.event_id = response['id']
            print(f"   Event ID: {self.event_id}")
        return success

    def test_get_schedule(self):
        """Test get schedule events"""
        success, response = self.run_test(
            "Get Schedule Events",
            "GET",
            "schedule",
            200
        )
        if success:
            print(f"   Found {len(response)} events")
        return success

    def test_get_reports(self):
        """Test get reports"""
        success, response = self.run_test(
            "Get Reports",
            "GET",
            "reports",
            200
        )
        if success:
            print(f"   Total patients: {response.get('total_patients', 0)}")
            print(f"   Total predictions: {response.get('total_predictions', 0)}")
        return success

    def test_delete_schedule_event(self):
        """Test deleting a schedule event"""
        if not self.event_id:
            print("❌ No event ID available for deletion")
            return False
        
        success, response = self.run_test(
            "Delete Schedule Event",
            "DELETE",
            f"schedule/{self.event_id}",
            200
        )
        return success

    def test_delete_patient(self):
        """Test deleting a patient (cleanup)"""
        if not self.patient_id:
            print("❌ No patient ID available for deletion")
            return False
        
        success, response = self.run_test(
            "Delete Patient",
            "DELETE",
            f"patients/{self.patient_id}",
            200
        )
        return success

def main():
    print("🚀 Starting XAI Pharma API Tests")
    print("=" * 50)
    
    tester = XAIPharmaAPITester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Initialize Sample Data", tester.test_init_sample_data),
        ("Get Patients", tester.test_get_patients),
        ("Create Patient", tester.test_create_patient),
        ("Get Patient Detail", tester.test_get_patient_detail),
        ("Run Prediction", tester.test_run_prediction),
        ("Get All Predictions", tester.test_get_predictions),
        ("Get Prediction Detail", tester.test_get_prediction_detail),
        ("Upload CSV File", tester.test_file_upload),
        ("Get Files", tester.test_get_files),
        ("Process File", tester.test_process_file),
        ("Create Schedule Event", tester.test_create_schedule_event),
        ("Get Schedule", tester.test_get_schedule),
        ("Get Reports", tester.test_get_reports),
        ("Delete Schedule Event", tester.test_delete_schedule_event),
        ("Delete Patient", tester.test_delete_patient),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())