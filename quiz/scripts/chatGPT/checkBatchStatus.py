from exec_batchAPI import BatchJobManager

def check_job_status(job_id: str):
    # Initialize the BatchJobManager
    manager = BatchJobManager()

    # Get the job status
    status = manager.get_job_status(job_id)

    # Print the status
    if status:
        print(f"Job Status: {status['status']}")
        if status['status'] == 'failed':
            print(f"Error Message: {status.get('error_message')}")
        elif status['status'] == 'completed':
            print("Job completed successfully.")
    else:
        print("Failed to retrieve job status.")

if __name__ == "__main__":
    job_id = "batch_6745222b2f5881908e2eb8a0fc6f9ba3"
    check_job_status(job_id)