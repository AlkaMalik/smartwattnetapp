#  Requirements

The project uses the following main dependencies:

- **Django** `>=5.0,<6.0`
- **Neo4j Python Driver** `>=5.0,<6.0`
- **Pandas** `>=2.0,<3.0`
- **NumPy** `>=1.24,<2.0`
- **TensorFlow** `>=2.x`

---

#  Installation Guide

Follow the steps below to set up the project locally.

---

## 1. Clone or Download the Project

Clone the repository from GitHub:

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
````

Or download the ZIP file and extract it.

---

## 2. Open the Project in Your IDE

Open the project folder in your preferred IDE, such as:

* VS Code
* PyCharm
* IntelliJ IDEA
* Any Python-supported editor

---

## 3. Create a Virtual Environment

Creating a virtual environment is recommended to isolate dependencies.

```bash
python -m venv venv
```

Activate the environment:

**Linux / macOS**

```bash
source venv/bin/activate
```

**Windows**

```bash
venv\Scripts\activate
```

---

## 4. Install Dependencies

Install the required packages using pip.

```bash
pip install -r requirements.txt
```

If installing manually:

```bash
pip install "Django>=5.0,<6.0" "neo4j>=5.0,<6.0" "pandas>=2.0,<3.0" "numpy>=1.24,<2.0" "tensorflow>=2.0"
```

---

## 5. Setup Neo4j Database

Make sure **Neo4j database** is installed and running.

Download from:
[https://neo4j.com/download/](https://neo4j.com/download/)

Create a database and update the Environment Variables .

ENV

```python
URI = "your-connection-uri"
DB = "your-db-name"
SECRET = "db-password"
```

---

## 6. Run the Development Server

Start the Django development server:

```bash
python manage.py runserver
```

---

## 7. Open the Application

Open your browser and go to:

```
http://127.0.0.1:8000/
```

---

# 🐳 Running the Project with Docker

You can also run this project using a **pre-built Docker image**, which avoids installing Python, dependencies, or configuring the environment manually.

## 1.  Install Docker

Make sure Docker is installed on your system.

Download Docker from:  
https://www.docker.com/products/docker-desktop/

Verify installation:

```bash
docker --version
```
---

## 2.  Pull the Docker Image

Pull the project image :
#alkamalik/smartwattnetapi:v3
#the docker image as hosted by the author
```
docker pull your-image-url
``` 
## 3. Run the Container

Run the application using:

```
docker run -p 8000:8000 \
-e URL=your-neo4j-instance-uri \
-e DB=db-name \
-e SECRET=your-password \
your-docker-image-url
```

This command maps port 8000 inside the container to port 8000 on your machine.

## 4. Open the Application

After the container starts, open your browser and go to:
```
http://localhost:8000
```
#  Tech Stack

* **Backend:** Django
* **Database:** Neo4j Graph Database
* **Data Processing:** Pandas, NumPy
* **Machine Learning:** TensorFlow

---

#  NOTE: 

* Always activate the virtual environment before running the project.
* Ensure Neo4j is running before starting the Django server.
* Install all dependencies listed in `requirements.txt`.

```

MIT License

Copyright (c) 2026 Alka Malik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
