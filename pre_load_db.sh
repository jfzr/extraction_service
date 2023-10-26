#!/bin/bash

# cURL command to upload the first file
curl -X POST -F "file=@/SOURCE/departments.csv" -F  http://localhost:3000/v1/upload

# cURL command to upload the second file
curl -X POST -F "file=@/SOURCE/jobs.csv" -F http://localhost:3000/v1/upload

# cURL command to upload the third file
curl -X POST -F "file=@/SOURCE/hired_employees.csv" -F http://localhost:3000/v1/upload
