This directory contains jobs that can be run through cron.


`async_badge_handler.py` removes undeserved badges and adds badges that must be given asynchronously.
It should be run once a day.

To run `async_badge_handler.py`, start the cron job editor with:

`crontab -e`

Now enter the cronjob, remembering to source the file containing your conda setup and activate a conda environment if you use one.

`0 1 * * * source ~/<.zshrc or equivalent depending on your setup> && conda activate <your environment> && cd /path/to/dynabench/api/cron && python async_badge_handler.py >handler_output.txt 2>handler_error.txt; conda deactivate`

This example command runs the job at 1:00AM every day.
If you are on the west coast of the US, then this is 9:00AM UTC.
Make sure that you set the time so that the job can start and finish on the same UTC day.

You should see 'Completed job' in `handler_output.txt` if the job worked.
