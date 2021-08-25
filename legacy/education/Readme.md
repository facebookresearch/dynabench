A. Instructions for students:

1. Go to dynabench.org and create an account.
2. Navigate to the "Examples" tab/subpage on your "Profile" page.
3. The subpage has a table that lists all tasks, and displays the user's stats on those tasks.
4. For each of the tasks, click on the "Export" button that allows you to export your student data for that task.
5. Email your teacher the exported json file.

B. Instructions for teachers:

1. Install Jupyter notebook:
   https://jupyter.readthedocs.io/en/latest/install/notebook-classic.html
2. Save all the json files that you received from all your students in a directory.
3. Save the file in the following format: '{identifier}_{task}.json', e.g. 'John_QA.json'
4. The example notebook dynabench-practicals.ipynb contains the code needed to compute and display top MER scores for students. Please specify the path for the target json files in the notebook. Run the notebook.

C. If you are running the notebook from the Terminal:

1. Start/Run code with the following commands:
	jupyter notebook
2. Run all cells of dynabench-practicals.ipynb sequentially in order from top to bottom.

D. If you are running the notebook from Google Colab:

1. Select 'File -> Upload notebook' in Colab's main dropdown menu, to upload the dynabench-practicals.ipynb file to Colab.
2. Upload all the students json files to the target directory.
3. Run all cells of dynabench-practicals.ipynb sequentially in order from top to bottom.
