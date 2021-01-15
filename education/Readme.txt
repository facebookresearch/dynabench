Instructions for students
*****************************
1. Navigate to the "Examples" tab/subpage on your "Profile" page.
2. The subpage has a table that lists all tasks, and displays the user's stats on those tasks.
3. For each of the tasks, click on the "Export" button that allows you to export your student data for that task. 
4. Email your teacher the exported json file. 

Instructions for teachers
*****************************
1. Save all the json files that you received from all your students in a directory.
2. Save the file in the following format: ‘student name/Id’ followed by task: 
   Example: John_QA.json
3. The example notebook contains the code needed to compute and display top MER scores by filename.

A. If you are running the notebook from the Terminal:
	- Install app dependencies: 
		pip install -r requirements.txt
	- Start/Run code with the following command: 
		Jupyter Notebook
	- If you want to activate pre-commit git hooks (black, flake8, and isort):
		pre-commit install
(Note: The prerequisites are that you have installed pip, python and jupyter notebook.)

B. If you are running the notebook from either Google Colab or Amazon Sagemaker then do the following:
	- Upload all the students .json files to the directory. 
	- Run the first cell with sample command '!pip install' to install dependencies
	- Run dynabench-practicals.ipynb

