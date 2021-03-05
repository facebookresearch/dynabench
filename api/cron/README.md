This directory contains jobs that can be run through cron.

`old_refresh_token_remover.py` removes refresh tokens that might not be used again from the db.
It can be run once a month or so.

`async_badge_handler.py` removes undeserved badges and adds badges that must be given asynchronously.
It should be run once a day.

To run these files, start the cron job editor with:

`crontab -e`

Now enter the cronjobs, remembering to source the file containing your conda setup and activate a conda environment if you use one.

`0 1 1 * * source ~/<.zshrc or equivalent depending on your setup> && conda activate <your environment> && cd /path/to/dynabench/api/cron && export PYTHONPATH=$PYTHONPATH:/path/to/dynabench/api && python old_refresh_token_remover.py >remover_output.txt 2>remover_error.txt; conda deactivate`
`0 1 * * * source ~/<.zshrc or equivalent depending on your setup> && conda activate <your environment> && cd /path/to/dynabench/api/cron && export PYTHONPATH=$PYTHONPATH:/path/to/dynabench/api && python async_badge_handler.py >handler_output.txt 2>handler_error.txt; conda deactivate`

This example runs the first job at 1:00AM on the first day of every month, and the second job at 1:00AM every day.
If you are on the west coast of the US, then this is 9:00AM UTC.
Make sure that you set the time so that the handler job can start and finish on the same UTC day.

You should see 'Removed old tokens' in `remover_output.txt` if the first job worked.
You should see 'Completed job' in `handler_output.txt` if the second job worked.
